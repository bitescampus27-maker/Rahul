import express from "express";
import PosOrder from "../models/posOrderModel.js";
import Food from "../models/foodModel.js";

const router = express.Router();

/* -----------------------------------------------------
   GENERATE POS ORDER NUMBER
------------------------------------------------------ */
const generatePosOrderNumber = async () => {

  const today = new Date();

  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");

  const datePrefix = `${month}${day}`;

  const startOfDay = new Date(today.setHours(0,0,0,0));
  const endOfDay = new Date(today.setHours(23,59,59,999));

  const todayOrders = await PosOrder.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const nextNumber = todayOrders.length + 1;

  const orderCount = String(nextNumber).padStart(3, "0");

  return `POS-${datePrefix}-${orderCount}`;
};


/* -----------------------------------------------------
   UPDATE POS ORDER STATUS (preparing → prepared)
------------------------------------------------------ */
router.post("/update-status", async (req, res) => {
  try {

    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.json({ success: false, message: "orderId and status required" });
    }

    const updatedOrder = await PosOrder.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.json({ success: false, message: "Order not found" });
    }

    return res.json({
      success: true,
      order: updatedOrder
    });

  } catch (error) {
    console.error("POS status update error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* -----------------------------------------------------
   CREATE POS ORDER → auto to kitchen
------------------------------------------------------ */
router.post("/order", async (req, res) => {

  try {

    const { items, orderType, customerName, customerPhone, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items in order"
      });
    }

    let orderItems = [];
    let totalAmount = 0;

    for (const item of items) {

  const foodId = item.foodId || item._id;

  if (!foodId) {
    return res.status(400).json({
      success: false,
      message: "Food ID missing"
    });
  }

  const food = await Food.findById(foodId);

  if (!food) {
    return res.status(404).json({
      success: false,
      message: `Food item not found: ${foodId}`
    });
  }

  const quantity = item.quantity || 1;


      orderItems.push({
        foodId: food._id,
        name: food.name,
        price: food.price,
        quantity,
      });

      totalAmount += food.price * quantity;
    }

    /* ---------- GENERATE ORDER NUMBER ---------- */
    const orderNumber = await generatePosOrderNumber();

    /* ---------- CREATE ORDER ---------- */
    const newOrder = await PosOrder.create({
      orderNumber,
      items: orderItems,
      totalAmount,
      orderType: orderType || "dine-in",
      customerName,
      customerPhone,
      paymentMethod: paymentMethod || "cash",
      isPaid: false,
      status: "preparing"
    });

    return res.status(201).json({
      success: true,
      message: "POS order created",
      order: newOrder
    });

  } catch (error) {
    console.error("POS order error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* -----------------------------------------------------
   GET ALL POS ORDERS (Admin)
------------------------------------------------------ */
router.get("/orders", async (req, res) => {

  try {

    const orders = await PosOrder.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders
    });

  } catch (error) {

    console.error("Fetch POS orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});


export default router;