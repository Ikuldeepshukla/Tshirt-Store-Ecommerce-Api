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
  managerAllUsers,
  admingetOneUser,
  adminUpdateOneUserDetails,
  adminDeleteOneUser
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
router.route("/admin/user/:id")
.get(isLoggedIn, customRole("admin"), admingetOneUser)
.put(isLoggedIn, customRole("admin"), adminUpdateOneUserDetails)
.delete(isLoggedIn, customRole("admin"), adminDeleteOneUser);

// sample code to add more roles
// router
//   .route("/manager/users")
//   .get(isLoggedIn, customRole("manager"), managerAllUsers);

module.exports = router;
