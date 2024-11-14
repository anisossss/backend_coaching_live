const router = require("express").Router();
const groupCtrl = require("../controllers/groupCtrl");
const auth = require("../middleware/auth");
const { uploadImage } = require("../services/multerGroups");

router.post("/add-group", auth, uploadImage.array("image"), groupCtrl.addGroup);

router.get("/my-groups", auth, groupCtrl.getMyGroups);

router.get("/all-groups", auth, groupCtrl.getAllGroups);
router.get("/all-public-groups", groupCtrl.getAllPublicGroups);

router.get("/group-by-id/:id", groupCtrl.getGroupById);

router.put("/update-group/:id", auth, groupCtrl.updateGroup);
router.put("/delete-group/:id", auth, groupCtrl.deleteGroup);

router.delete("/delete-groups", groupCtrl.deleteGroups);

router.put("/join-group/:id", auth, groupCtrl.joinGroup);
router.put("/unjoin-group/:id", auth, groupCtrl.unjoinGroup);

module.exports = router;
