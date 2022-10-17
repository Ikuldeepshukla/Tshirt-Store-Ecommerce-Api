const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  logout,
  forgotpassword,
  resetPassword,
  getIsLoggedInUserDetails,
  updatePassword,
  updateUserDetails,
  adminAllUser,
} = require("../controllers/userControllers");
const { isLoggedIn, customRole } = require("../middlewares/user");

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/forgotpassword").post(forgotpassword);
router.route("/password/reset/:token").post(resetPassword);
router.route("/userdashboard").get(isLoggedIn, getIsLoggedInUserDetails);
router.route("/password/update").post(isLoggedIn, updatePassword);
router.route("/userdashboard/update").post(isLoggedIn, updateUserDetails);

router.route("/admin/users").get(isLoggedIn, customRole("admin"), adminAllUser);

module.exports = router;

//861299045690910
