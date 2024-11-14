const router = require("express").Router();
const chatbotCtrl = require("../controllers/chatbotCtrl");
const path = require("path");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });
router.post("/speech-to-text", upload.single("audio"), chatbotCtrl.stt);
router.post("/text-to-speech", chatbotCtrl.tts);

router.post("/mentor-message", chatbotCtrl.mentorMessage);
module.exports = router;
