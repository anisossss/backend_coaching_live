const router = require("express").Router();
const userCtrl = require("../controllers/userCtrl");
const auth = require("../middleware/auth");
const { uploadUserImage, uploadProductImage } = require("../services/multer");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
router.post("/change-password", auth, userCtrl.changePassword);

router.post("/newsletter", userCtrl.newsletter);
router.post("/contact", userCtrl.contact);

router.get("/infor-by-id", auth, userCtrl.getUserInforWeb);

router.post("/create-checkout", auth, userCtrl.createCheckout);
router.post("/check-payment/:sessionId", auth, userCtrl.checkPaymentStatus);

router.put(
  "/update-profile",
  uploadUserImage.single("profilePic"),
  auth,
  userCtrl.updateProfile
);

module.exports = router;
