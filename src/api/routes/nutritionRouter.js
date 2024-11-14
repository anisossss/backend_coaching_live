const router = require("express").Router();
const nutritionCtrl = require("../controllers/nutritionCtrl");
const multer = require("multer");
const auth = require("../middleware/auth");
const upload = multer({ storage: multer.memoryStorage() });
router.post(
  "/upc-code-reader",
  upload.single("image"),
  nutritionCtrl.codeReader
);
router.post("/lookup-single-product", auth, nutritionCtrl.upcScanProduct);
router.get("/lookup-multi-products", auth, nutritionCtrl.upcScanProducts);
router.get("/get-scanned-products", auth, nutritionCtrl.getScannedFood);

router.get("/get-food-products", auth, nutritionCtrl.getFoodProducts);
router.post("/nutrition-data", auth, nutritionCtrl.nutritionData);

module.exports = router;
