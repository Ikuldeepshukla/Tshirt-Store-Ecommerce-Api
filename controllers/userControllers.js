const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");
const mailHelper = require("../utils/emailHelper");
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {
  let result;
  if (!req.files) {
    return next(new CustomError("Photo is required", 400));
  }
  if (req.files) {
    let file = req.files.photo;
    result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder: "users",
      width: 150,
      crop: "scale",
    });
  }
  console.log(req.body);
  const { name, email, password } = req.body;
  if (!email || !name || !password) {
    return next(new CustomError("Name, Email and Password are required", 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });

  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new CustomError("Email and Password are required", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(
      new CustomError("You dont have an account, try signing up", 400)
    );
  }

  const isValidatedUser = await user.isValidatedPassword(password);

  if (!isValidatedUser) {
    return next(new CustomError("Incorrect password", 400));
  }

  cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logout success",
  });
});

exports.forgotpassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new CustomError("User does not exist.!", 404));
  }

  const forgotToken = await user.getForgotPasswordToken();

  await user.save({ validateBeforeSave: false });

  const myUrl = `${req.protocol}//${req.get(
    "host"
  )}/api/v1/password/reset/${forgotToken}`;

  const message = `Copy paste this link to your url and hit enter \n\n ${myUrl}`;

  try {
    await mailHelper({
      email: user.email,
      subject: `Tshirt Store - password reset`,
      message: message,
    });

    res.status(200).json({
      success: true,
      message: "Reset email sent to your email",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    user.save({ validateBeforeSave: false });
    return next(new CustomError(error.message, 500));
  }
});

exports.resetPassword = BigPromise(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  const encryToken = await crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: encryToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError("Token is invalid or expired..!!", 400));
  }

  if (password !== confirmPassword) {
    return next(
      new CustomError("Password and Confirm Password do not match", 400)
    );
  }

  console.log(user);

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();
  user.password = undefined;

  return res.status(201).json(user);
});

exports.getIsLoggedInUserDetails = BigPromise(async (req, res, next) => {
  const user = await User.findById({ _id: req.userId });
  user.password = undefined;
  res.status(200).send(user);
});

exports.updatePassword = BigPromise(async (req, res, next) => {
  const { password, newPassword } = req.body;

  const user = await User.findById({ _id: req.userId }).select("+password");

  if (!user.isValidatedPassword(password)) {
    return next(new CustomError("Please enter correct password", 403));
  }

  user.password = newPassword;
  await user.save();

  cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  const { name, email } = req.body;

  // validate request data
  if (!name && !email && !req.files) {
    return next(new CustomError("Provide some information to update", 403));
  }

  let newData = {};

  if (name) {
    newData.name = name;
  }

  if (email) {
    newData.email = email;
  }

  // image update
  if (req.files) {
    const user = await User.findById({ _id: req.userId });
    const imageId = user.photo.id;
    await cloudinary.v2.uploader.destroy(imageId);
    const result = await cloudinary.v2.uploader.upload(
      req.files.photo.tempFilePath,
      { folder: "users", width: 150, crop: "scale" }
    );
    newData.photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    { _id: req.userId },
    newData,
    { new: true, runValidators: true, useFindAndModify: false }
  );

  updatedUser.password = undefined;

  return res.status(201).json({
    success: true,
    user: updatedUser,
  });
});

exports.adminAllUser = BigPromise(async (req, res, next) => {
  const users = await User.find();

  return res.status(200).json({
    success: true,
    users,
  });
});

exports.managerAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find({ role: "user" });

  res.status(200).json({
    success: true,
    users,
  });
});

exports.admingetOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  user.password = undefined;
  return res.status(200).json({
    success: true,
    user,
  });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError("No such user found", 401));
  }

  const imageId = user.photo.id;
  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  return res.status(200).json({
    success: true,
  });
});
