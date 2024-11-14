const router = require("express").Router();
const postCtrl = require("../controllers/postCtrl");
const auth = require("../middleware/auth");
const trial = require("../middleware/trial");

router.post("/share-post", auth, trial, postCtrl.sharePost);
router.put("/update-my-post/:id", auth, trial, postCtrl.updateMyPost);
router.get("/all-posts", auth, trial, postCtrl.getAllPost);
router.get("/all-my-posts", auth, trial, postCtrl.getAllMyPost);
router.get("/all-posts-by-userId/:userId", auth, postCtrl.getPostByUserId);

router.get("/all-posts-by-groupId/:groupId", postCtrl.getPostByGroupeId);

router.get("/post-by-id/:id", auth, trial, postCtrl.getPostById);

router.put("/like-post/:id", auth, trial, postCtrl.likePost);
router.put("/dislike-post/:id", auth, trial, postCtrl.dislikePost);
router.put("/add-comment/:id", auth, trial, postCtrl.addCommentPost);
// router.put("/update-comment/:id/:idComment", auth, postCtrl.updateCommentPost);
router.put(
  "/delete-comment/:id/:idComment",
  auth,
  trial,
  postCtrl.deleteCommentPost
);
module.exports = router;
