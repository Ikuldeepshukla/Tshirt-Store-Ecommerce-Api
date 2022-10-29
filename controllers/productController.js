const BigPromise = require("../middlewares/bigPromise");

exports.testProduct = BigPromise((req, res, next) => {
  res.status(200).json({
    success: true,
    message: "this is test product",
  });
});
