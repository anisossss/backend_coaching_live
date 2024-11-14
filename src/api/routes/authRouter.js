const router = require("express").Router();
const authCtrl = require("../controllers/authCtrl");

const auth = require("../middleware/auth");

router.post("/google-auth", authCtrl.googleAuth);
router.post("/apple-auth", authCtrl.appleAuth);

router.post("/register-email", authCtrl.registerEmail);
router.post("/register-phone", authCtrl.registerPhone);
router.get("/email-verification", authCtrl.verifyEmail);

router.post("/resend-email-verification", authCtrl.resendEmail);

router.post("/resend-otp", authCtrl.resendOTP);
router.post("/verify-otp", authCtrl.verifyOTP);

router.post("/onboarding", authCtrl.completeProfile);

router.post("/login", authCtrl.login);
router.post("/login-phone", authCtrl.loginPhone);

router.post("/forgot-password-email", authCtrl.forgotPasswordEmail);
router.post(
  "/reset-password-email/:userId/:token",
  authCtrl.resetPasswordEmail
);

router.post("/forgot-password-phone", authCtrl.forgotPasswordPhone);
router.post("/reset-password-phone", authCtrl.resetPasswordPhone);

router.post("/logout", auth, authCtrl.logout);
router.post("/refresh-token", authCtrl.generateAccessToken);

module.exports = router;
