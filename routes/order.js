const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOneOrder,
  getUserOrder,
} = require("../controllers/orderController");
const { isLoggedIn } = require("../middlewares/user");

router.route("/order/create").post(isLoggedIn, createOrder);

router.route("/order/myorder").get(isLoggedIn, getUserOrder);

router.route("/order/:id").get(isLoggedIn, getOneOrder);

module.exports = router;
