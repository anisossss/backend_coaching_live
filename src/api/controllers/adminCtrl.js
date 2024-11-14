const Users = require("../models/userModel");
const Groups = require("../models/groupModel");
const Recipe = require("../models/recipeModel");
const FoodItem = require("../models/foodItemModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const SGmail = require("@sendgrid/mail");
const ejs = require("ejs");

SGmail.setApiKey(process.env.SENDGRID_API_KEY);

const adminCtrl = {
  deleteUsers: async (req, res) => {
    try {
      const result = await Users.deleteMany({ name: "" });
      res.status(200).json({
        success: true,
        message: `${result.deletedCount} users deleted.`,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  contactGlow: async (req, res) => {
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
        "./src/api/controllers/views/contactGlow.ejs",
        { email: email, subject: subject }
      );

      const message = {
        to: "glowdynamicsllc@gmail.com",
        from: "support@kitchen-savvy.com",
        subject: "Contact Support",
        text: "New Contact Request",
        html: emailTemplate,
      };

      const sent = await SGmail.send(message, (err, result) => {
        return res.status(200).json({
          success: true,
          message: "Contact support sent successfully",
        });
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  addFood: async (req, res) => {
    try {
      const foodData = req.body.foodData;
      const insertedFoodItems = await FoodItem.insertMany(
        foodData.map((item) => ({
          name: item.name,
          category: item.category,
          image: item.image,
        }))
      );

      res.status(201).json({
        success: true,
        message: "Food items added successfully",
        data: insertedFoodItems,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  updateMealsType: async (req, res) => {
    try {
      const mealTimes = ["Breakfast", "Lunch", "Dinner", "Snack"];
      Recipe.find({}, function (err, recipes) {
        if (err) {
          console.log(err);
        } else {
          recipes.map((recipe) => {
            const randomMealTime =
              mealTimes[Math.floor(Math.random() * mealTimes.length)];
            Recipe.findByIdAndUpdate(
              recipe._id,
              { $set: { mealTime: randomMealTime } },
              function (err, result) {
                if (err) {
                  console.log(err);
                }
              }
            );
          });
        }
      });

      res.status(200).json({
        success: true,
        message: "MealType updated successfully for all recipes!",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  createPlans: async (req, res, next) => {
    try {
      const { name, description, amount, id } = req.body;
      const product = await stripe.products.create({
        name: name,
        description: description,
      });

      const price = await stripe.prices.create({
        unit_amount: amount,
        currency: "usd",

        product: product.id,
      });

      res.status(200).json({
        success: true,
        message: "Plans Added Successfully",
        product_id: product.id,
        price_id: price.id,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  deletePlan: async (req, res, next) => {
    try {
      const { id } = req.params;

      const deleted = await stripe.products.del(id);

      res.status(200).json({
        success: true,
        message: "Plan deleted Successfully",
        deleted,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  getPlans: async (req, res, next) => {
    try {
      const products = await stripe.products.list();
      res.status(200).json({
        success: true,
        message: "Plan retrieved Successfully",
        products,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  getAllUsers: async (req, res, next) => {
    try {
      const users = await Users.find();
      res.status(200).json({
        success: true,
        message: "Users retrieved Successfully",
        users,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  getAllGroups: async (req, res) => {
    try {
      const allGroups = await Groups.find();

      const totalCount = await Groups.countDocuments();

      console.log(allGroups);
      for (let i = 0; i < allGroups.length; i++) {
        const dataRecipe = await Recipe.find({ groupeId: allGroups[i]._id });
        allGroups.totalRecipe = dataRecipe.length;
      }

      return res.status(200).json({
        success: true,
        message: "All Groups listed",
        data: {
          allGroups,
          totalCount,
          nbrRecipe: allGroups.totalRecipe,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
};
function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
module.exports = adminCtrl;
