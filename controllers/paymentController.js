const BigPromise = require("../middlewares/bigPromise");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
    clientSecret: paymentIntent.client_secret,
  });
});
