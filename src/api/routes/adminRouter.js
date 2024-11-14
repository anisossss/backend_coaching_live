const router = require("express").Router();
const adminCtrl = require("../controllers/adminCtrl");

router.post("/contact-glow", adminCtrl.contactGlow);
router.delete("/delete-users", adminCtrl.deleteUsers);

router.post("/add-food", adminCtrl.addFood);
router.post("/create-plans", adminCtrl.createPlans);

router.post("/delete-plan/:id", adminCtrl.deletePlan);
router.post("/get-plans", adminCtrl.getPlans);

router.get("/get-users", adminCtrl.getAllUsers);

router.get("/all-groups", adminCtrl.getAllGroups);
router.post("/update-meals-type", adminCtrl.updateMealsType);

module.exports = router;
