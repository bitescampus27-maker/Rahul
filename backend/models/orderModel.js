import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // ✅ Allow guest orders (userId not required)
    userId: {
      type: String,
      required: false,
      default: null,
    },

    items: {
      type: Array,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    address: {
      type: Object,
      required: true,
    },

    // Optional delivery fee support
    deliveryFee: {
      type: Number,
      default: 0,
    },

    // Order status system
    status: {
      type: String,
      default: "pending",
    },

    payment: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;