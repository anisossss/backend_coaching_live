const router = require("express").Router();
const recipeCtrl = require("../controllers/recipeCtrl");
const auth = require("../middleware/auth");

router.post("/get-similar-recipes", recipeCtrl.getSimilarRecipes);
router.get("/all-recipes-category", recipeCtrl.getRecipesByCategory);
router.get("/all-recipes", recipeCtrl.getAllRecipes);
router.get("/all-my-recipes", auth, recipeCtrl.getAllMyRecipes);
router.get(
  "/all-recipes-by-userId/:userId",
  auth,
  recipeCtrl.getRecipeByUserId
);
router.get("/recipe-by-id/:id", auth, recipeCtrl.getRecipeById);
router.get("/public-recipe-by-id/:id", recipeCtrl.getPublicRecipeById);

router.get(
  "/recipe-by-group-id/:id",
  auth,

  recipeCtrl.getAllRecipeByGroup
);

router.post("/add-favorite", auth, recipeCtrl.addFavorite);
router.post("/delete-favorite", auth, recipeCtrl.deleteFavorite);
router.get("/get-favorites", auth, recipeCtrl.getFavorites);

router.post("/add-review", auth, recipeCtrl.addReview);
router.delete("/delete-review", auth, recipeCtrl.deleteReview);
router.put("/update-review", auth, recipeCtrl.updateReview);

module.exports = router;
