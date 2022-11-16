const Order = require("../models/order");
const Product = require("../models/product");

const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const product = require("../models/product");

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
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new CustomError("Please check the order id", 401));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getUserOrder = BigPromise(async (req, res, next) => {
  const order = await Order.find({ user: req.userId });

  if (!order) {
    return next(new CustomError("Please check the order id", 401));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminGetAllOrders = BigPromise(async (req, res, next) => {
  const orders = await Order.find();

  res.status(200).json({
    success: true,
    orders,
  });
});

exports.adminUpdateOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (order.orderStatus === "Delivered") {
    return next(new CustomError("Order is already marked as delivered", 401));
  }

  order.orderStatus = req.body.orderStatus;

  order.orderItem.forEach(async (prod) => {
    await updateProductStock(prod.product, prod.quantity);
  });

  await order.save();
  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminDeleteOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new CustomError("No such order exist", 401));
  }

  await order.remove();

  res.status(200).json({
    success: true
  });
});

async function updateProductStock(productId, quantity) {
  const product = await Product.findById(productId);
  product.stock = product.stock - quantity;
  await product.save({ validateBeforeSave: false });
}
