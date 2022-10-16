const BigPromise = require("../middlewares/bigPromise");

exports.home = BigPromise((req, res) => {
  res.status(200).json({
    success: true,
    greeting: "Hello from API",
  });
});

exports.homeDummy = BigPromise((req, res) => {
  res.status(200).json({
    message: "This is dummy route",
  });
});


