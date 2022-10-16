const BigPromise = require("./bigPromise");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const CustomError = require("../utils/customError");

const isLoggedIn = BigPromise(async (req, res, next) => {
  const token =
    req.cookies.token || req.header("Authorization").replace("Bearer ", "");

  if (!token) {
    return new CustomError("You need to login first", 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded) {
    req.userId = decoded.id;
    next();
  } else {
    return new CustomError("Token invalid", 403);
  }
});

module.exports = isLoggedIn;
