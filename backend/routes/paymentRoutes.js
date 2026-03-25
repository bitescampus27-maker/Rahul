import express from "express";
import { razorpayInstance } from "../config/razorpay.js";
import crypto from "crypto";

const router = express.Router();

/* =========================================
   CREATE RAZORPAY ORDER
========================================= */

router.post("/create-order", async (req, res) => {

  try {

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    const options = {
      amount: Math.round(amount * 100), // convert ₹ to paise
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };

    const order = await razorpayInstance.orders.create(options);

    return res.json({
      success: true,
      id: order.id,
      currency: order.currency,
      amount: order.amount
    });

  } catch (error) {

    console.error("RAZORPAY CREATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Order creation failed"
    });

  }

});


/* =========================================
   VERIFY PAYMENT
========================================= */

router.post("/verify-payment", (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment data"
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {

      return res.json({
        success: true,
        message: "Payment verified successfully"
      });

    } else {

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });

    }

  } catch (error) {

    console.error("RAZORPAY VERIFY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed"
    });

  }

});


export default router;