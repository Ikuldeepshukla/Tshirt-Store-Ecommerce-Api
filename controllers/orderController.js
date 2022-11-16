const Order = require("../models/order");
const Product = require("../models/product");

const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");

exports.createOrder = BigPromise(async (req, res, next) => {
  const {
    shippingInfo,
    orderItem,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItem,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
    user: req.userId,
  });

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getOneOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new CustomError("Please check the order id", 401));
  }

  res.status(200).json({
    success: true,
    order,
  });
});
