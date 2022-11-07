const express = require("express");
const {
  addProduct,
  getAllProduct,
  adminGetAllProduct,
  getOneProduct,
  adminUpdateOneProduct,
  adminDeleteOneProduct,
} = require("../controllers/productController");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/user");

// user routes
router.route("/product").get(getAllProduct);

// get one product
router.route("/product/:id").get(getOneProduct);

/*------ admin only routes -------*/
// admin add product
router
  .route("/admin/products/add")
  .post(isLoggedIn, customRole("admin"), addProduct);

// admin get all products
router
  .route("/admin/products")
  .get(isLoggedIn, customRole("admin"), adminGetAllProduct);

// admin update one product
router
  .route("/admin/products/:id")
  .put(isLoggedIn, customRole("admin"), adminUpdateOneProduct);

// admin delete one product
router
  .route("/admin/products/:id")
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);

module.exports = router;
