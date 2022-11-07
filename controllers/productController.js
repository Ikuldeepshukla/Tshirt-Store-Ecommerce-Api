const Product = require("../models/product");
const CustomError = require("../utils/customError");
const BigPromise = require("../middlewares/bigPromise");
const cloudinary = require("cloudinary");
const WhereClause = require("../utils/whereClause");

exports.addProduct = BigPromise(async (req, res, next) => {
  // images
  let imagesArray = [];

  if (!req.files) {
    return next(new CustomError("Images are required", 401));
  }

  if (req.files) {
    for (let index = 0; index < req.files.photos.length; index++) {
      let result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        { folder: "products" }
      );
      console.log(result);
      imagesArray.push({ id: result.public_id, secure_url: result.secure_url });
    }
  }

  req.body.photos = imagesArray;
  req.body.user = req.userId;

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    product,
  });
});

exports.getAllProduct = BigPromise(async (req, res, next) => {
  const resultPerPage = 6;

  const totalProductCount = await Product.countDocuments();

  const productsObj = new WhereClause(Product.find(), req.query)
    .search()
    .filter();

  let products = await productsObj.base;
  const filteredProductNumber = products.length;

  // products.limit().skip();

  productsObj.pager(resultPerPage);

  products = await productsObj.base.clone();

  res.status(200).json({
    success: true,
    products,
    filteredProductNumber,
    totalProductCount,
  });
});

exports.getOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError("No Product Found", 404));
  }

  res.status(200).json({
    succes: true,
    product,
  });
});

// admin only controllers
exports.adminGetAllProduct = BigPromise(async (req, res, next) => {
  const products = await Product.find({});

  if (!products) {
    return next(new CustomError("No Products Found", 404));
  }

  res.status(200).json({
    succes: true,
    products,
  });
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError("No product found with thius Id", 404));
  }

  let imagesArray = [];
  if (req.files) {
    // destroy the existing images
    for (let index = 0; index < product.photos.length; index++) {
      await cloudinary.v2.uploader.destroy(product.photos[index].id);
    }
    // upload and save the images
    for (let index = 0; index < req.files.photos.length; index++) {
      let result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        { folder: "products" } // folder name can be put into env file
      );
      imagesArray.push({ id: result.public_id, secure_url: result.secure_url });
    }
    req.body.photos = imagesArray;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError("Product not found", 404));
  }

  // destroy the existing images
  for (let index = 0; index < product.photos.length; index++) {
    await cloudinary.v2.uploader.destroy(product.photos[index].id);
  }

  // remove the product
  await product.remove();

  res.status(200).json({
    succes: true,
    message: "Product is deleted successfully",
  });
});
