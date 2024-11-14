const router = require("express").Router();
const userCtrl = require("../controllers/userCtrl");
const auth = require("../middleware/auth");
const { uploadUserImage, uploadProductImage } = require("../services/multer");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
router.post("/change-password", auth, userCtrl.changePassword);

router.post("/newsletter", userCtrl.newsletter);
router.post("/contact", userCtrl.contact);
router.post("/new", userCtrl.newClient);

router.get("/infor-by-id", auth, userCtrl.getUserInforWeb);

router.post("/create-checkout", auth, userCtrl.createCheckout);
router.post("/check-payment/:sessionId", auth, userCtrl.checkPaymentStatus);

router.put(
  "/update-profile",
  uploadUserImage.single("profilePic"),
  auth,
  userCtrl.updateProfile
);
router.post("/calculate-calories", userCtrl.calculateCalories);

//  MEAL PLANNER  //

router.post("/create-plan", auth, userCtrl.createPlan);
router.post("/trial-meal-plan", userCtrl.createTrialPlan);
router.get("/get-plan-by-id/:planId", userCtrl.getPlanById);

router.get("/get-plan", auth, userCtrl.getPlan);
router.delete("/reset-plan", auth, userCtrl.resetPlan);
router.delete("/auto-delete-plan", auth, userCtrl.autoDeletePlan);

router.post("/add-meal", auth, userCtrl.addMeal);
router.post("/add-food-meal", auth, userCtrl.addFoodMeal);
router.post("/add-food-product", auth, userCtrl.addFoodProduct);
////
router.get("/get-recent", auth, userCtrl.getRecent);
////////
router.post(
  "/add-product-manually",
  auth,
  uploadProductImage.single("productPic"),
  userCtrl.addProductManually
);

////

// router.put("/update-plan", auth, userCtrl.updatePlan);
router.put("/update-goal-calories", auth, userCtrl.updateGoalCalories);
router.put("/update-portion", auth, userCtrl.updatePortion);

router.delete("/delete-meal", auth, userCtrl.deleteMeal);

router.post("/track-water", auth, userCtrl.trackWaterIntake);
router.get("/track-water-history", auth, userCtrl.trackWaterHistory);

router.post("/chatbot", auth, userCtrl.chatbot);

module.exports = router;
