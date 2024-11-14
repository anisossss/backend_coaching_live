const router = require("express").Router();
const toolCtrl = require("../controllers/toolCtrl");
const auth = require("../middleware/auth");

router.post("/generate", auth, toolCtrl.generateRecipe);
router.post("/demo-generate", toolCtrl.demoGenerateRecipe);
router.post("/generate-dish-recipe", auth, toolCtrl.generateDishRecipe);
router.post(
  "/demo-generate-dish-recipe",

  toolCtrl.demoGenerateDishRecipe
);

module.exports = router;
