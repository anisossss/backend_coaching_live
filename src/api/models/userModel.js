const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema(
  {
    name: {
      type: String,
    },

    email: {
      type: String,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
    },

    password: {
      type: String,
    },
    googleAuth: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
    },
    website: {
      type: String,
    },
    instagram: {
      type: String,
    },
    youtube: {
      type: String,
    },
    height: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    bmi: {
      type: Number,
    },
    dietPreference: {
      type: [String],
    },
    allergy: {
      type: [String],
    },
    healthGoals: {
      type: [String],
    },
    profilePic: {
      type: String,
    },
    heartRate: {
      type: String,
    },
    sleep: {
      type: String,
    },
    customerId: {
      type: String,
    },

    customer_city: {
      type: String,
    },
    customer_country: {
      type: String,
    },
    customer_line1: {
      type: String,
    },
    customer_postal: {
      type: String,
    },
    customer_state: {
      type: String,
    },
    customer_email: {
      type: String,
    },
    customer_name: {
      type: String,
    },
    customer_phone: {
      type: String,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    credits: {
      type: Number,
      default: 50,
    },
    purchasedCredits: {
      type: Number,
    },
    allowedRecipes: {
      type: Number,
      default: 5,
    },
    generatedRecipes: {
      type: Number,
      default: 0,
    },
    subscriptionStatus: {
      type: Boolean,
      default: false,
    },
    subscriptionId: {
      type: String,
    },
    lastSessionId: {
      type: String,
    },

    currentPlan: {
      type: String,
      default: "",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    deleteAcount: {
      type: Boolean,
      default: false,
    },
    website: {
      type: String,
    },
    instagram: {
      type: String,
    },
    youtube: {
      type: String,
    },
    profilePhoto: {
      type: String,
    },
    online: {
      type: Boolean,
      default: false,
    },
    idealWeight: Number,
    mealsPerDay: Number,
    waterIntakeGoal: Number,
    mealTime: String,
    notifications: [String],
    detailedActivityLevel: String,
    eatingStyle: String,
    favorite: {
      type: [
        {
          recipeId: { type: Schema.Types.ObjectId, ref: "recipe" },
          date: { type: Date, default: Date.now() },
        },
      ],
    },
    invoiceId: {
      type: String,
    },
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "order",
      },
    ],
    plan: {
      type: [
        {
          recipeId: { type: Schema.Types.ObjectId, ref: "MealPlan" },
          date: { type: Date, default: Date.now() },
        },
      ],
    },
    recent: {
      type: [
        {
          name: String,
          image: String,
          calories: Number,
          weight: Number,
        },
      ],
    },
    waterIntake: [
      {
        date: {
          type: Date,
          required: true,
        },
        totalFilledCups: {
          type: Number,
          required: true,
        },
      },
    ],
    ref: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("user", userSchema);
