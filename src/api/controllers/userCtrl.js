const Users = require("../models/userModel");
const Orders = require("../models/orderModel");

const Newsletter = require("../models/newsletterModel");
const bcrypt = require("bcrypt");
const Contact = require("../models/contactModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const ejs = require("ejs");
const SGmail = require("@sendgrid/mail");
const authToken = process.env.AUTH_TOKEN;
const accountSid = process.env.ACCOUNT_SID;
const client = require("twilio")(accountSid, authToken);
SGmail.setApiKey(process.env.SENDGRID_API_KEY);

const userCtrl = {
  changePassword: async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Please enter your old and new password.",
        });
      }
      const user = Users.findOne({ _id: req.user._id });
      if (user.googleAuth) {
        return res.status(400).json({
          success: false,
          message: "You have a google account connected.",
        });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Your old password is wrong.",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long.",
        });
      }

      if (oldPassword == newPassword)
        return res
          .status(400)
          .json({ message: "You must enter a new password" });

      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        { password: newPasswordHash }
      );
      res.status(200).json({
        success: true,
        message: "Password updated successfully !",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  newsletter: async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(401).json({
          success: false,
          message: "Please enter your email",
        });
      }
      let emailTemplate = await ejs.renderFile(
        "./src/api/controllers/views/newsletter.ejs",
        {
          email,
        }
      );

      const message = {
        to: email,
        from: "support@kitchen-savvy.com",
        subject: "Newsletter subscription",
        text: "You have successfully subscribed to our newsletter",
        html: emailTemplate,
      };

      const sent = await SGmail.send(message, (err, result) => {
        if (err) {
          res.status(400).json(err);
        } else {
          const contact = {
            email: email,
          };

          let newContact = new Newsletter(contact);
          newContact.save();
          return res.status(200).json({
            success: true,
            message: "Newsletter subscription successful",
            contact,
          });
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  contact: async (req, res, next) => {
    try {
      const { email, subject } = req.body;
      if (!email || !subject) {
        return res.status(401).json({
          success: false,
          message: "Please fill all fields",
        });
      }
      if (!validateEmail(email)) {
        return res.status(402).json({
          success: false,
          message: "Invalid email",
        });
      }
      let emailTemplate = await ejs.renderFile(
        "./src/api/controllers/views/contact.ejs"
      );

      const message = {
        to: email,
        from: "support@kitchen-savvy.com",
        subject: "Contact Support",
        text: "Kitchn Savvy Support",
        html: emailTemplate,
      };

      const sent = await SGmail.send(message, (err, result) => {
        console.log("Welcome mail was sent");
        if (err) {
          res.status(400).json(err);
        } else {
          const contact = {
            email: email,
          };

          let newContact = new Contact(contact);
          newContact.save();
          return res.status(200).json({
            success: true,
            message: "Contact support sent successfully",
            contact,
          });
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  createCheckout: async (req, res, next) => {
    try {
      const user = await Users.findById(req.user.id).select("-password");
      if (!user) {
        return res.status(403).json({
          success: false,
          message: "You need to login",
        });
      }

      const price_id = req.body.price_id;
      const name = req.body.name;

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.CLIENT_URL}/success/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/error`,
      });

      let currentPlan = "";
      if (price_id == "price_1O7vYMBwRCSfgWaXCTNQ1NJn") {
        currentPlan = "Monthly Starter";
      }
      if (price_id == "price_1O7vbZBwRCSfgWaXQeWTuY3p") {
        currentPlan = "Annually Starter";
      }
      if (price_id == "price_1O7vcPBwRCSfgWaXoxd3by55") {
        currentPlan = "Monthly Master Chief";
      }
      if (price_id == "price_1O7vcvBwRCSfgWaXrpNejarU") {
        currentPlan = "Annually Master Chief";
      }

      const newOrder = new Orders({
        price_id: price_id,
        name,
        user: user,
        status: "Pending payment",
        plan: currentPlan,
      });

      const order = await newOrder.save();

      user.orders.push(order);
      user.currentPlan = currentPlan;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Session URL",
        url: session.url,
        order,
        user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  checkPaymentStatus: async (req, res) => {
    const { sessionId } = req.params;

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      let idUser;
      const user = await Users.findById(req.user.id).select("-password");
      if (user.lastSessionId === session.id) {
        return res.status(401).json({
          success: false,
          message: "Payment already processed",
        });
      }
      if (session.payment_status === "paid") {
        idUser = user._id;

        if (user.currentPlan === "Monthly Starter") {
          user.allowedRecipes += 505;
        } else if (user.currentPlan === "Annually Starter") {
          user.allowedRecipes += 50005;
        } else if (user.currentPlan === "Monthly Master Chief") {
          user.allowedRecipes += 600005;
        } else if (user.currentPlan === "Annually Master Chief") {
          user.allowedRecipes += 600005;
        }
        const order = await Orders.findOne({ user: req.user.id });
        order.status = "Paid";
        await order.save();

        const updatedUser = await Users.findOneAndUpdate(
          { _id: idUser },
          {
            $set: {
              lastSessionId: sessionId,
              allowedRecipes: user.allowedRecipes,
              subscriptionStatus: true,
              customer: session.customer,
              customer_city: session.customer_details.address.city,
              customer_country: session.customer_details.address.country,
              customer_line1: session.customer_details.address.line1,
              customer_postal: session.customer_details.address.postal_code,
              customer_state: session.customer_details.address.state,
              customer_email: session.customer_details.email,
              customer_name: session.customer_details.name,
              customer_phone: session.customer_details.phone,
              subscriptionId: session.subscription,
              invoiceId: session.invoice,
            },
          },
          { new: true }
        );

        if (updatedUser) {
          let emailTemplate = await ejs.renderFile(
            "./src/api/controllers/views/checkout.ejs"
          );

          const message = {
            to: updatedUser.email,
            from: "support@kitchen-savvy.com",
            subject: "Subscription successful",
            text: "You have successfully subscribed to Kitchen Savvy plan",
            html: emailTemplate,
          };

          const sent = await SGmail.send(message);
          console.log(sent);

          return res.status(200).json({
            success: true,
            message: "Payment successful and account status updated",
          });
        } else {
          res.status(400).json({
            success: false,
            message: "Unable to update account status",
          });
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      res
        .status(500)
        .json({ success: false, message: "Error checking payment status" });
    }
  },
  getUserInforWeb: async (req, res, next) => {
    try {
      const user = await Users.findById(req.user._id).select("-password");
      res.status(200).json({
        success: true,
        message: "User Information",
        user,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const {
        name,
        website,
        youtube,
        gender,
        age,
        instagram,
        phoneNumber,
        height,
        weight,
        bmi,
        dietPreference,
        healthGoals,
        allergy,
        heartRate,
        sleep,
      } = req.body;
      console.log(req.body);
      const user = await Users.findById(req.user.id).select("-password");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (height && (height < 0 || height > 300)) {
        return res.status(400).json({
          success: false,
          message: "Height must be between 0 and 300",
        });
      }
      if (weight && (weight < 0 || weight > 300)) {
        return res.status(400).json({
          success: false,
          message: "Weight must be between 0 and 300",
        });
      }

      const updateFields = {};
      if (name) updateFields.name = name;
      if (age) updateFields.age = age;
      if (gender) updateFields.gender = gender;
      if (website) updateFields.website = website;
      if (instagram) updateFields.instagram = instagram;
      if (youtube) updateFields.youtube = youtube;
      if (height) updateFields.height = height;
      if (weight) updateFields.weight = weight;
      if (bmi) updateFields.bmi = bmi;
      if (dietPreference) updateFields.dietPreference = dietPreference;
      if (allergy) updateFields.allergy = allergy;
      if (healthGoals) updateFields.healthGoals = healthGoals;
      if (phoneNumber) updateFields.phoneNumber = phoneNumber;
      if (heartRate) updateFields.heartRate = heartRate;
      if (sleep) updateFields.sleep = sleep;

      await Users.findOneAndUpdate({ _id: user.id }, updateFields);
      res
        .status(200)
        .json({ success: true, message: "Account updated successfully!" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
const calculateBMR = (gender, weight, height, age) => {
  if (gender === "male") {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else if (gender === "female") {
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }
  return null;
};

const adjustForActivityLevel = (bmr, activityLevel) => {
  const activityMultipliers = {
    level_1: 1.2,
    level_2: 1.375,
    level_3: 1.55,
    level_4: 1.725,
    level_5: 1.9,
  };

  return bmr * activityMultipliers[activityLevel];
};
const sumNutritionalValues = (recipes) => {
  const totalNutrients = {
    Protein: 0,
    Fiber: 0,
    Calcium: 0,
    Iron: 0,
    Potassium: 0,
    Cholesterol: 0,
    Sodium: 0,
    VitaminD: 0,
  };

  recipes.forEach((recipe) => {
    const { nutritionInfo } = recipe.recipe;
    if (nutritionInfo) {
      nutritionInfo.forEach((info) => {
        const parts = info.split(":");
        if (parts.length === 2) {
          const nutrientName = parts[0].trim().split(" ")[1];
          const nutrientValue = parseFloat(parts[1].trim());

          switch (nutrientName) {
            case "Protein":
              totalNutrients.Protein += nutrientValue;
              break;
            case "Fiber":
              totalNutrients.Fiber += nutrientValue;
              break;
            case "Calcium":
              totalNutrients.Calcium += nutrientValue;
              break;
            case "Iron":
              totalNutrients.Iron += nutrientValue;
              break;
            case "Potassium":
              totalNutrients.Potassium += nutrientValue;
              break;
            case "Cholesterol":
              totalNutrients.Cholesterol += nutrientValue;
              break;
            case "Sodium":
              totalNutrients.Sodium += nutrientValue;
              break;
            case "Vitamin D":
              totalNutrients.VitaminD += nutrientValue;
              break;
            default:
              break;
          }
        }
      });
    }
  });

  return totalNutrients;
};
const isDifferentDayMonth = (date1, date2) => {
  return (
    date1.getDate() !== date2.getDate() || date1.getMonth() !== date2.getMonth()
  );
};
module.exports = userCtrl;
