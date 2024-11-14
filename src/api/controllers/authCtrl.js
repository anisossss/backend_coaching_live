const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const ejs = require("ejs");
const Users = require("../models/userModel");
const Token = require("../models/tokenModel");
const generateToken = require("../services/TokenGenerate");
const authToken = process.env.AUTH_TOKEN;
const SGmail = require("@sendgrid/mail");
const accountSid = process.env.ACCOUNT_SID;
const client = require("twilio")(accountSid, authToken);
SGmail.setApiKey(process.env.SENDGRID_API_KEY);
const clientGoogle = new OAuth2(process.env.CLIENT_ID);

const authCtrl = {
  completeProfile: async (req, res) => {
    try {
      const {
        name,
        gender,
        height,
        weight,
        idealWeight,
        dietPreference,
        allergy,
        healthGoals,
        mealsPerDay,
        waterIntakeGoal,
        mealTime,
        notifications,
        detailedActivityLevel,
        eatingStyle,
      } = req.body;

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

      // Prepare user data
      const userData = {
        name,
        gender,
        height,
        weight,
        idealWeight,
        dietPreference,
        allergy,
        healthGoals,
        mealsPerDay,
        waterIntakeGoal,
        mealTime,
        notifications,
        detailedActivityLevel,
        eatingStyle,
      };

      const newUser = new Users(userData);
      // const savedUser = await newUser.save();

      res.status(201).json({
        success: true,
        message: "Profile completed successfully and user created.",
        // userId: savedUser._id,
      });
    } catch (error) {
      console.error("Profile completion error:", error);
      res.status(500).json({
        success: false,
        message: "Server error, please try again later",
      });
    }
  },
  appleAuth: async (req, res) => {
    try {
      const { identityToken } = req.body;
      console.log(identityToken);

      // Decode Apple Identity Token
      const decoded = jwt.decode(identityToken);

      if (!decoded) {
        return res
          .status(400)
          .json({ message: "Invalid Apple Identity Token" });
      }

      const { email, name } = decoded;

      if (!email) {
        return res
          .status(400)
          .json({ message: "Email is required for signup." });
      }

      // Check if user already exists in the database
      const user = await Users.findOne({ email });
      if (!user) {
        try {
          const newUser = new Users({
            name: name || "Apple User", // Fallback for undefined name
            email,
            appleAuth: true,
          });

          const access_token = generateToken.createAccessToken({
            id: newUser._id,
          });
          const refresh_token = generateToken.createRefreshToken({
            id: newUser._id,
          });
          await newUser.save();

          return res.status(200).json({
            success: true,
            message: "Registered Successfully",
            access_token,
            refresh_token,
          });
        } catch (error) {
          return res
            .status(500)
            .json({ message: "Error saving new user: " + error.message });
        }
      } else {
        const access_token = generateToken.createAccessToken({ id: user._id });
        const refresh_token = generateToken.createRefreshToken({
          id: user._id,
        });

        return res.status(200).json({
          success: true,
          message: "Logged in Successfully",
          access_token,
          refresh_token,
          user,
        });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  googleAuth: async (req, res) => {
    try {
      const { tokenId } = req.body;
      const verify = await clientGoogle.verifyIdToken({
        idToken: tokenId,
      });
      const { email, name } = verify.payload;
      const user = await Users.findOne({ email });
      if (!user) {
        const newUser = new Users({
          name,
          email,
          googleAuth: true,
        });

        const access_token = generateToken.createAccessToken({
          id: newUser._id,
        });
        const refresh_token = generateToken.createRefreshToken({
          id: newUser._id,
        });
        await newUser.save();
        return res.status(200).json({
          success: true,
          message: "Registered Successfully",
          access_token,
          refresh_token,
        });
      } else {
        const access_token = generateToken.createAccessToken({ id: user._id });
        const refresh_token = generateToken.createRefreshToken({
          id: user._id,
        });

        return res.status(200).json({
          success: true,
          message: "Logged in Successfully",
          access_token,
          refresh_token,
          user,
        });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
  registerEmail: async (req, res, next) => {
    try {
      const { name, email, password, confirmPassword } = req.body;
      console.log("Request Body:", req.body);

      // Check required fields
      if (!name || !password || !confirmPassword) {
        console.log("Missing fields");
        return res.status(403).json({
          success: false,
          message: "Not all fields have been entered",
        });
      }

      // Validate email format
      if (!validateEmail(email)) {
        console.log("Invalid email format");
        return res.status(401).json({
          success: false,
          message: "Invalid email",
        });
      }

      // Check if email already exists
      const user_email = await Users.findOne({ email });
      if (user_email) {
        console.log("Email already registered");
        return res.status(400).json({
          success: false,
          message: "This email is already registered",
        });
      }

      // Validate password length
      if (password.length < 6) {
        console.log("Password too short");
        return res.status(402).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Confirm passwords match
      if (password !== confirmPassword) {
        console.log("Passwords do not match");
        return res.status(405).json({
          success: false,
          message: "Passwords do not match",
        });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 12);
      console.log("Password hashed");

      const newUser = new Users({
        name,
        email,
        password: passwordHash,
      });

      // Save new user
      const user = await newUser.save();
      console.log("User saved:", user);

      // Generate or find token
      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        console.log("Creating new token");
        token = await new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
      }

      // Encrypt token data
      var data = [{ userId: user._id }, { token: token.token }];
      var ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        "secret key 1234567890"
      )
        .toString()
        .replace(/\+/g, "%2B");

      const newPath = `${process.env.BASE_URL_EMAIL}/api/auth/email-verification?scheme=${ciphertext}`;
      console.log("New path:", newPath);

      // Render email template
      let emailTemplate = await ejs.renderFile(
        "./src/api/controllers/views/confirm.ejs",
        { newPath: newPath }
      );

      // Prepare email message
      const message = {
        to: email,
        from: "support@kitchen-savvy.com",
        subject: "Email Activation",
        text: "Welcome aboard, please confirm your email address",
        html: emailTemplate,
      };

      // Send email
      console.log("Sending email to:", email);
      await SGmail.send(message);

      // Success response
      return res.status(200).json({
        success: true,
        message: "Registration successful! Please confirm your email.",
        user: {
          emailVerified: newUser.emailVerified,
          _id: newUser._id,
        },
      });
    } catch (err) {
      console.error("Error during registration:", err); // Log the error message
      return res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  },

  registerPhone: async (req, res, next) => {
    try {
      const { name, password, confirmPassword, phoneNumber } = req.body;
      console.log(req.body);
      if (!validator.isMobilePhone(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number",
        });
      }
      const user_phone = await Users.findOne({ phoneNumber });
      if (user_phone) {
        return res.status(400).json({
          success: false,
          message: "This phone is already registered !",
        });
      }
      if (!password || !confirmPassword)
        return res.status(403).json({
          success: false,
          message: "Not all fields have been entered",
        });

      if (password.length < 8) {
        return res.status(402).json({
          success: false,
          message: "Password must be at least 8 characters long",
        });
      }
      if (password !== confirmPassword)
        return res.status(405).json({
          success: false,
          message: "Password must be identical",
        });

      client.verify.v2
        .services(process.env.SERVICE_ID)
        .verifications.create({
          to: `+${phoneNumber}`,
          channel: "sms",
        })
        .then((verification) => {
          console.log(verification);
        });
      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = new Users({
        name,
        phoneNumber,
        password: passwordHash,
      });

      const user = await newUser.save();
      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        token = await new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
      }

      return res.status(200).json({
        success: true,
        message: "Registration successful! Confirm your phone number",
        user: {
          phoneVerified: newUser.phoneVerified,
          _id: newUser._id,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  resendEmail: async (req, res, next) => {
    try {
      const regex = /\ /gi;
      const lastdata = req.query.scheme.replace(regex, "+");

      var bytes = CryptoJS.AES.decrypt(lastdata, "secret key 1234567890");
      var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      const user = await Users.findById(decryptedData[0].userId);
      const email = user.email;

      if (user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "User is already verified",
        });
      }
      let token = await Token.findOne({ userId: decryptedData[0].userId });
      if (!token) {
        token = await new Token({
          userId: decryptedData[0].userId,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
      }
      var data = [{ userId: user._id }, { token: token.token }];

      var ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        "secret key 1234567890"
      )
        .toString()
        .replace(/\+/gi, "%2B");

      const newPath = `${process.env.BASE_URL_EMAIL}/api/auth/email-verification?scheme=${ciphertext}`;

      let emailTemplate = await ejs.renderFile(
        "./src/api/controllers/views/confirm.ejs",
        { newPath: newPath }
      );

      const message = {
        to: email,
        from: "support@kitchen-savvy.com",
        subject: "Email Activation",
        text: "Welcome abroad, please confirm your email address",
        html: emailTemplate,
      };
      const sent = await SGmail.send(message, (err, result) => {
        if (err) {
          res.status(400).json({
            success: false,
            message: err.message,
          });
        } else {
          return res.status(200).json({
            success: true,
            message: "Resend activation link successfully",
          });
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  resendOTP: async (req, res, next) => {
    try {
      const phoneNumber = req.body.phoneNumber;
      if (phoneNumber) {
        const phoneNumber = req.body.phoneNumber;
        const user_phone = await Users.findOne({ phoneNumber });
        if (user_phone.phoneVerified) {
          return res.status(400).json({
            success: false,
            message: "This phone is already verified !",
          });
        }
        client.verify.v2
          .services(process.env.SERVICE_ID)
          .verifications.create({
            to: `+${phoneNumber}`,
            channel: "sms",
          })
          .then((verification) => {
            console.log(verification);
          });
        res.status(200).json({
          success: true,
          message: "OTP is sent successfully !",
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  verifyEmail: async (req, res, next) => {
    try {
      const regex = /\%2B/gi;
      const data = req.query.scheme.replace(regex, "+");
      var bytes = CryptoJS.AES.decrypt(data, "secret key 1234567890");
      var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

      const user = await Users.findById(decryptedData[0].userId);

      const token = await Token.findOne({
        userId: decryptedData[0].userId,
        token: decryptedData[1].token,
      });

      if (!user) {
        res.statusCode = 403;
        res.setHeader("Content-Type", "text/html");
        res.sendFile(__dirname + "/views/error.ejs");
      }
      if (!token) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "text/html");
        res.sendFile(__dirname + "/views/error.ejs");
      }
      if (user.emailVerified) {
        res.statusCode = 402;
        res.setHeader("Content-Type", "text/html");
        res.sendFile(__dirname + "/views/verified.ejs");
      }

      const verifiedUser = await Users.findOneAndUpdate(
        { _id: decryptedData[0].userId },
        { emailVerified: true },
        { returnOriginal: false }
      );
      if (token) {
        await token.delete();
      }

      if (verifiedUser) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.sendFile(__dirname + "/views/success.ejs");
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  verifyOTP: async (req, res) => {
    try {
      const code = req.body.code;
      const phoneNumber = req.body.phoneNumber;
      console.log(req.body);
      const user_phone = await Users.findOne({ phoneNumber });
      if (!user_phone) {
        return res.status(404).json({
          success: false,
          message: "User with that phone number does not exist!",
        });
      }
      if (code.length !== 6) {
        return res.status(405).json({
          success: false,
          message: "Code should be 6 digits !",
        });
      }
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "No phone number in request",
        });
      }
      if (!code) {
        return res.status(400).json({
          success: false,
          message: "No code in request",
        });
      }
      client.verify.v2
        .services(process.env.SERVICE_ID)
        .verificationChecks.create({ to: `+${phoneNumber}`, code: code })
        .then((verification_check) => {
          console.log("verification_check", verification_check);
          if (verification_check.valid === false) {
            return res.status(401).json({
              success: false,
              message: "OTP is incorrect!",
            });
          }
          if (verification_check.status === "approved") {
            user_phone.phoneNumber = phoneNumber;
            user_phone.phoneVerified = true;
            user_phone.save();
            const access_token = generateToken.createAccessToken({
              id: user_phone._id,
            });
            const refresh_token = generateToken.createRefreshToken({
              id: user_phone._id,
            });
            console.log("user after update", user_phone);

            res.status(200).json({
              success: true,
              message: "Phone number is Verified !",
              access_token,
              refresh_token,
            });
          } else {
            return res.status(500).json({
              success: false,
              message: "Verification failed !",
            });
          }
        })
        .catch((error) => {
          console.log(error);
          return res.status(500).json({
            success: false,
            message: "OTP is incorrect or expired",
          });
        });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "OTP is incorrect or expired",
      });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(req.body);
      if (!email || !password)
        return res.status(403).json({
          success: false,
          message: "Not all fields have been entered",
        });
      if (!validateEmail(email))
        return res.status(400).json({
          success: false,
          message: "Invalid email",
        });
      const user = await Users.findOne({ email }).populate("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not registred",
        });
      }
      if (!user.emailVerified) {
        let token = await Token.findOne({ userId: user._id });
        if (!token) {
          token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString("hex"),
          }).save();
        }
        var data = [{ userId: user._id }, { token: token.token }];

        var ciphertext = CryptoJS.AES.encrypt(
          JSON.stringify(data),
          "secret key 1234567890"
        )
          .toString()
          .replace(/\+/gi, "%2B");
        const newPath = `${process.env.BASE_URL_EMAIL}/api/auth/email-verification?scheme=${ciphertext}`;
        let emailTemplate = await ejs.renderFile(
          "./src/api/controllers/views/confirm.ejs",
          { newPath: newPath }
        );

        const message = {
          to: email,
          from: "support@kitchen-savvy.com",
          subject: "Email Activation",
          text: "Welcome abroad, please confirm your email address",
          html: emailTemplate,
        };
        const sent = await SGmail.send(message, (err, result) => {
          return res.status(401).json({
            success: false,
            message:
              "Your Email has not been verified yet. A new verification is sent !",
          });
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(402).json({
          success: false,
          message: "Password is incorrect",
        });
      }

      const access_token = generateToken.createAccessToken({ id: user._id });
      const refresh_token = generateToken.createRefreshToken({ id: user._id });
      console.log(access_token);
      console.log(refresh_token);
      user.online = true;
      user.save();
      return res.status(200).json({
        success: true,
        message: "LoggedIn successfully!",
        access_token,
        refresh_token,
        user: {
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
          _id: user._id,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  loginPhone: async (req, res) => {
    try {
      const { phoneNumber, password } = req.body;
      console.log(req.body);
      if (!phoneNumber || !password)
        return res.status(403).json({
          success: false,
          message: "Not all fields have been entered",
        });
      if (!validator.isMobilePhone(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number",
        });
      }

      const user = await Users.findOne({ phoneNumber }).populate("-password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not registred",
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(402).json({
          success: false,
          message: "Password is incorrect",
        });
      }
      if (!user.phoneVerified) {
        client.verify.v2
          .services(process.env.SERVICE_ID)
          .verifications.create({
            to: `+${phoneNumber}`,
            channel: "sms",
          })
          .then((verification) => {
            console.log(verification);
          });
        return res.status(401).json({
          success: false,
          message:
            "Your Phone number has not been verified, a new OTP is sent !",
        });
      }

      const access_token = generateToken.createAccessToken({ id: user._id });
      const refresh_token = generateToken.createRefreshToken({ id: user._id });

      user.online = true;
      user.save();
      return res.status(200).json({
        success: true,
        message: "LoggedIn successfully!",
        access_token,
        refresh_token,
        user: {
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
          _id: user._id,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  generateAccessToken: async (req, res) => {
    const refreshToken = req.body.refreshToken;
    const accessToken = req.headers["authorization"];
    try {
      const decodedAccessToken = jwt.decode(accessToken);

      const decodedRefreshToken = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      console.log("refresh", decodedRefreshToken);
      console.log("access", decodedAccessToken);

      if (decodedRefreshToken.id === decodedAccessToken.id) {
        const newAccessToken = jwt.sign(
          { id: decodedRefreshToken.id },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "1h",
          }
        );
        return res.status(200).json({
          message: "Token generated successfully",
          accessToken: newAccessToken,
        });
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  logout: async (req, res) => {
    try {
      const user = await Users.findOne({ _id: req.user._id });
      if ((user.online = false)) {
        return res.status(400).json({
          success: false,
          message: "Already logged out",
          user,
        });
      } else {
        user.online = false;
        user.save();
        console.log("logged out successfully", user);
        return res.status(200).json({
          success: true,
          message: "Logged out Successfully.",
          user,
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
        code: "0x0006",
      });
    }
  },
  forgotPasswordEmail: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email)
        return res.status(400).json({
          success: false,
          message: "No Email in request",
        });
      console.log("Forgot password finding user with given email", email);
      const user = await Users.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User with given email doesn't exist",
        });
      }

      let token = await Token.findOne({ userId: user._id });
      if (token) {
        await token.deleteOne();
      }
      const resetToken = await new Token({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();

      let emailTemplate = await ejs.renderFile(
        "./src/api/controllers/views/passwordRecover.ejs",
        { token: resetToken.token, userId: user._id }
      );

      const message = {
        to: email,
        from: "support@kitchen-savvy.com",
        subject: "Password Recovery",
        text: "You asked to recover your password, please follow the steps required",
        html: emailTemplate,
      };

      await SGmail.send(message);

      return res.status(200).json({
        success: true,
        message: "Password reset link sent to your email account",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
  resetPasswordEmail: async (req, res) => {
    try {
      const user = await Users.findById(req.params.userId);
      if (!user)
        return res.status(400).json({
          success: false,
          message: "Invalid link or expired",
        });

      const { newPassword } = req.body;
      if (!newPassword)
        return res.status(403).json({
          success: false,
          message: "You must enter a password",
        });
      if (newPassword.length < 8) {
        return res.status(402).json({
          success: false,
          message: "Password must be at least 8 characters long",
        });
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);

      const token = await Token.findOne({
        userId: user._id,
        token: req.params.token,
      });
      if (!token)
        return res.status(400).json({
          success: false,
          message: "Invalid link or expired, send another link.",
        });
      console.log(token);
      user.password = passwordHash;
      await token.delete();

      await user.save();
      res.status(200).json({
        success: true,
        message: "Password reset successfully.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  forgotPasswordPhone: async (req, res, next) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "No phone number in request",
        });
      }
      const user = await Users.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User with that phone number does not exist!",
        });
      }
      client.verify.v2
        .services(process.env.SERVICE_ID)
        .verifications.create({
          to: `+${phoneNumber}`,
          channel: "sms",
        })
        .then((verification) => {
          console.log(verification);
        });
      return res.status(200).json({
        success: true,
        message: "Reset Password OTP is sent successfully !",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  resetPasswordPhone: async (req, res) => {
    try {
      const { code, phoneNumber, newPassword } = req.body;
      console.log(req.body);
      const user = await Users.findOne({ phoneNumber });
      const passwordHash = await bcrypt.hash(newPassword, 12);
      if (!code) {
        return res.status(400).json({
          success: false,
          message: "No code in request",
        });
      }
      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: "You must enter a password",
        });
      }
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "No phone number in request",
        });
      }
      if (!user)
        return res.status(400).json({
          success: true,
          message: "User with that phone number does not exist!",
        });
      if (code.length !== 6) {
        return res.status(405).json({
          success: false,
          message: "Code should be 6 digits !",
        });
      }
      const verificationCheck = await client.verify.v2
        .services(process.env.SERVICE_ID)
        .verificationChecks.create({ to: `+${phoneNumber}`, code: code });
      if (verificationCheck.valid === false) {
        return res.status(401).json({
          success: false,
          message: "OTP is incorrect or expired !",
        });
      }
      if (verificationCheck.status === "approved") {
        user.password = passwordHash;
        user.save();
        return res.status(200).json({
          success: true,
          message: "You can login with your new password !",
        });
      }
    } catch (err) {
      if (err.status === 404 && err.code === 20404) {
        return res.status(500).json({
          success: false,
          message: "OTP is incorrect or expired !",
        });
      }
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

module.exports = authCtrl;
