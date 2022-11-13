const Product = require("../models/product");
const CustomError = require("../utils/customError");
const BigPromise = require("../middlewares/bigPromise");
const cloudinary = require("cloudinary");
const WhereClause = require("../utils/whereClause");
const User = require("../models/user");

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

exports.addReview = BigPromise(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  // get user details from database
  const user = await User.findById(req.userId);

  // prepare review object
  const review = {
    user: user._id,
    name: user.name,
    rating: Number(rating),
    comment: comment,
  };

  // get product
  const product = await Product.findById(productId);

  // check if already reviewed
  const alreadyReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.userId.toString()
  );

  if (alreadyReviewed) {
    // if already reviewed then update the review
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.userId.toString()) {
        rev.comment = comment;
        rev.rating = rating;
      }
    });
  } else {
    // else add a new review
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }

  // adjust ratings
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  // save product
  await product.save({ validateBeforeSave: false });

  // send response
  res.status(200).json({
    success: true,
  });
});

exports.deleteReview = BigPromise(async (req, res, next) => {
  const { productId } = req.query;

  const product = await Product.findById(productId);

  const reviews = product.reviews.filter(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  const numberOfReviews = reviews.length;

  // adjust rating
  product.ratings =
    product.reviews.redyce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  // update the product
  await Product.findByIdAndUpdate(
    productId,
    {
      reviews,
      ratings,
      numberOfReviews,
    },
    {
      new: true,
      runValidators: true,
      userFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});

exports.getOnlyReviewsForOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  res.status(200).json({
    success: true,
    reviews: product.reviews,
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
