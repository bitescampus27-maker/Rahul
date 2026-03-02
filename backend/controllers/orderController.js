import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const currency = "inr";
const frontend_URL = "http://localhost:5173";

/* ================= SAFE ITEMS VALIDATION ================= */
const validateItems = (items) => {
  if (!Array.isArray(items)) return false;
  if (items.length === 0) return false;

  for (let item of items) {
    if (!item._id || !item.name || !item.price || !item.quantity) {
      return false;
    }
  }
  return true;
};

/* ================= PLACE ORDER (ONLINE - STRIPE) ================= */
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address, deliveryFee } = req.body;

    // 🔥 Validate items properly
    if (!validateItems(items)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart items"
      });
    }

    const newOrder = new orderModel({
      userId: userId || null,
      items,
      amount,
      address,
      specialInstructions: address?.specialInstructions || "",
      status: "pending",
      deliveryFee: deliveryFee || 0,
      payment: false
    });

    await newOrder.save();

    if (userId) {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
    }

    // Stripe line items
    const line_items = items.map((item) => ({
      price_data: {
        currency,
        product_data: { name: item.name },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    if (deliveryFee && deliveryFee > 0) {
      line_items.push({
        price_data: {
          currency,
          product_data: { name: "Delivery Charge" },
          unit_amount: deliveryFee * 100,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      success_url: `${frontend_URL}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_URL}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
    });

    res.json({ success: true, session_url: session.url });

  } catch (err) {
    console.error("PLACE ORDER ERROR:", err);
    res.status(500).json({ success: false, message: "Order failed" });
  }
};

/* ================= PLACE ORDER (COD) ================= */
const placeOrderCod = async (req, res) => {
  try {
    const { userId, items, amount, address, deliveryFee } = req.body;

    if (!validateItems(items)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart items"
      });
    }

    const newOrder = new orderModel({
      userId: userId || null,
      items,
      amount,
      address,
      specialInstructions: address?.specialInstructions || "",
      payment: false,
      status: "pending",
      deliveryFee: deliveryFee || 0
    });

    await newOrder.save();

    if (userId) {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("COD ORDER ERROR:", err);
    res.status(500).json({ success: false, message: "COD order failed" });
  }
};

/* ================= LIST ALL ORDERS ================= */
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

/* ================= USER ORDERS ================= */
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    const orders = await orderModel
      .find({ userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

/* ================= ACCEPT ================= */
const acceptOrder = async (req, res) => {
  await orderModel.findByIdAndUpdate(req.body.orderId, {
    status: "preparing",
  });
  res.json({ success: true });
};

/* ================= REJECT ================= */
const rejectOrder = async (req, res) => {
  await orderModel.findByIdAndUpdate(req.body.orderId, {
    status: "rejected",
  });
  res.json({ success: true });
};

/* ================= KITCHEN ================= */
const kitchenOrders = async (req, res) => {
  const orders = await orderModel.find({ status: "preparing" });
  res.json({ success: true, orders });
};

/* ================= PREPARED ================= */
const markPrepared = async (req, res) => {
  await orderModel.findByIdAndUpdate(req.body.orderId, {
    status: "prepared",
  });
  res.json({ success: true });
};

/* ================= DELIVERED ================= */
const markDelivered = async (req, res) => {
  await orderModel.findByIdAndUpdate(req.body.orderId, {
    status: "delivered",
  });
  res.json({ success: true });
};

/* ================= VERIFY PAYMENT ================= */
const verifyOrder = async (req, res) => {
  if (req.body.success === "true") {
    await orderModel.findByIdAndUpdate(req.body.orderId, { payment: true });
    res.json({ success: true });
  } else {
    await orderModel.findByIdAndDelete(req.body.orderId);
    res.json({ success: false });
  }
};

/* ================= GET BILL ================= */
const getBillByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "delivered") {
      return res.json({
        success: false,
        message: "Bill available only for delivered orders",
      });
    }

    const bill = {
      orderId: order._id,
      customerName: order.address?.fullName || "Customer",
      items: order.items,
      amount: order.amount,
      deliveryFee: order.deliveryFee || 0,
      totalAmount: order.amount + (order.deliveryFee || 0),
      status: order.status,
      createdAt: order.createdAt,
    };

    res.json({
      success: true,
      bill,
    });

  } catch (error) {
    console.error("GET BILL ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bill",
    });
  }
};

export {
  placeOrder,
  placeOrderCod,
  listOrders,
  userOrders,
  acceptOrder,
  rejectOrder,
  kitchenOrders,
  markPrepared,
  markDelivered,
  verifyOrder,
  getBillByOrderId
};
