const BigPromise = require("../middlewares/bigPromise");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require("uuid");

exports.sendStripeKey = BigPromise(async (req, res, next) => {
  res.status(200).json({
    stripeKey: process.env.STRIPE_KEY,
  });
});

exports.captureStripePayment = BigPromise(async (req, res, next) => {
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "inr",
    // optional
    metadata: {
      integration_check: "accept_a_payment",
    },
  });

  res.status(200).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

exports.sendRazorpayKey = BigPromise(async (req, res, next) => {
  res.status(200).json({
    razorpayKey: process.env.RAZORPAY_ID,
  });
});

exports.captureRazorpayPayment = BigPromise(async (req, res, next) => {
  // Create a PaymentIntent with the order amount and currency
  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });

  const options = {
    amount: req.body.amount,
    currency: "INR",
    receipt: await uuidv4(),
  };

  const myOrder = await instance.orders.create(options);

  res.status(200).json({
    success: true,
    amount: req.body.amount,
    order: myOrder,
  });
});
