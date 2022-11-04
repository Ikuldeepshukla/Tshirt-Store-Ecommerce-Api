const express = require("express");
const { addProduct } = require("../controllers/productController");
const router = express.Router();

router.route("/addproduct").get(addProduct);

module.exports = router;
