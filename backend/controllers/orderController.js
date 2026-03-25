  import orderModel from "../models/orderModel.js";
  import userModel from "../models/userModel.js";


  const currency = "inr";
  const frontend_URL = "http://localhost:5173";

  /* ================= VALIDATE ITEMS ================= */

  const validateItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) return false;

    return items.every(
      (item) =>
        item._id &&
        item.name &&
        item.price != null &&
        item.quantity != null
    );
  };

  /* ================= FACULTY VALIDATION ================= */

  const validateFacultyAccess = (address) => {
    const SECRET = (process.env.FACULTY_SECRET_CODE || "").trim().toUpperCase();

    if (!address) return false;

    if (address.userType === "faculty") {
      const incoming = (address.facultyCode || "").trim().toUpperCase();
      if (!incoming || incoming !== SECRET) return false;
    }

    return true;
  };
/* ================= GENERATE 3 DIGIT ORDER NUMBER ================= */

const generateOrderNumber = async () => {

  const today = new Date();

  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");

  const datePrefix = `${month}${day}`;

  const startOfDay = new Date(today.setHours(0,0,0,0));
  const endOfDay = new Date(today.setHours(23,59,59,999));

  const todayOrders = await orderModel.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const nextNumber = todayOrders.length + 1;

  const orderCount = String(nextNumber).padStart(3, "0");

  return `CB-${datePrefix}-${orderCount}`;
};
  /* ================= CREATE ORDER OBJECT ================= */

  const createOrderObject = async ({ userId, items, amount, discount, couponCode, address, deliveryFee }) => {

  const orderNumber = await generateOrderNumber();

  return new orderModel({
    orderNumber,
    userId: userId || null,

    // ⭐ FIXED HERE
    items: items.map(item => ({
      ...item,
      productType: item.productType
    })),

    amount,
    discount: discount || 0,
    couponCode: couponCode || null,

    address,
    specialInstructions: address?.specialInstructions || "",
    payment: false,
    status: "pending",
    deliveryFee: deliveryFee || 0
  });
};

  /* ================= CLEAR USER CART ================= */

  const clearUserCart = async (userId) => {
    if (userId) {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
    }
  };

  /* ================= PLACE ORDER (ONLINE - STRIPE) ================= */

  const placeOrder = async (req, res) => {
    try {
      const { userId, items, amount, discount, couponCode, address, deliveryFee } = req.body;

      if (!validateItems(items)) {
        return res.status(400).json({
          success: false,
          message: "Invalid cart items"
        });
      }

      if (!validateFacultyAccess(address)) {
        return res.status(403).json({
          success: false,
          message: "Invalid faculty verification code"
        });
      }

    const order = await createOrderObject({
    userId,
    items,
    amount,
    discount,
    couponCode,
    address,
    deliveryFee
  });

      await order.save();
      await clearUserCart(userId);

    res.json({
  success: true,
  orderId: order.orderNumber
});

    } catch (error) {
      console.error("PLACE ORDER ERROR:", error);
      res.status(500).json({ success: false, message: "Order failed" });
    }
  };

  /* ================= PLACE ORDER (COD) ================= */

  const placeOrderCod = async (req, res) => {
    try {
      const { userId, items, amount, discount, couponCode, address, deliveryFee } = req.body;

      if (!validateItems(items)) {
        return res.status(400).json({
          success: false,
          message: "Invalid cart items"
        });
      }

      if (!address || address.userType === "student") {
        return res.status(403).json({
          success: false,
          message: "Students cannot use Cash on Delivery"
        });
      }

      if (!validateFacultyAccess(address)) {
        return res.status(403).json({
          success: false,
          message: "Invalid faculty verification code"
        });
      }

      const order = await createOrderObject({
        userId,
        items,
        amount,
        address,
        deliveryFee
      });

      await order.save();
      await clearUserCart(userId);

      res.json({ success: true });

    } catch (error) {
      console.error("COD ORDER ERROR:", error);
      res.status(500).json({ success: false, message: "COD order failed" });
    }
  };

  /* ================= LIST ALL ORDERS ================= */

  const listOrders = async (req, res) => {
    try {
      const orders = await orderModel.find().sort({ createdAt: -1 });

      res.json({
        success: true,
        data: orders
      });

    } catch (error) {
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

      res.json({
        success: true,
        data: orders
      });

    } catch (error) {
      res.status(500).json({ success: false });
    }
  };

  /* ================= ORDER STATUS ================= */

  const acceptOrder = async (req, res) => {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: "preparing" });
    res.json({ success: true });
  };

  const rejectOrder = async (req, res) => {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: "rejected" });
    res.json({ success: true });
  };

  const kitchenOrders = async (req, res) => {
    const orders = await orderModel.find({ status: "preparing" });
    res.json({ success: true, orders });
  };

  const markPrepared = async (req, res) => {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: "prepared" });
    res.json({ success: true });
  };

  const markDelivered = async (req, res) => {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: "delivered" });
    res.json({ success: true });
  };

  /* ================= VERIFY PAYMENT ================= */

  const verifyOrder = async (req, res) => {
    if (req.body.success === "true") {
      await orderModel.findByIdAndUpdate(req.body.orderId, { payment: true });
      res.json({ success: true });
    } else {
      await orderModel.findByIdAndUpdate(req.body.orderId, {
        status: "payment_failed"
      });
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
          message: "Order not found"
        });
      }

      if (order.status !== "delivered") {
        return res.json({
          success: false,
          message: "Bill available only for delivered orders"
        });
      }

      const bill = {
        orderId: order.orderNumber,
        customerName: order.address?.fullName || "Customer",
        items: order.items,
        amount: order.amount,
        deliveryFee: order.deliveryFee || 0,
        totalAmount: order.amount + (order.deliveryFee || 0),
        status: order.status,
        createdAt: order.createdAt
      };

      res.json({
        success: true,
        bill
      });

    } catch (error) {
      console.error("GET BILL ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Server error while fetching bill"
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