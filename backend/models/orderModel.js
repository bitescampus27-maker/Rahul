import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },

    userId: {
      type: String,
      required: false,
      default: null,
    },

    // ⭐ FIX: DEFINE ITEM STRUCTURE
    items: [
      {
        _id: String,
        name: String,
        price: Number,
        quantity: Number,
        productType: {
          type: String,
          productType: {
  type: String,
  enum: ["packed", "unpacked"],
  required: true
} // ⭐ DEFAULT
        }
      }
    ],

    amount: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      default: 0,
    },

    couponCode: {
      type: String,
      default: null,
    },

    address: {
      type: Object,
      required: true,
    },

    deliveryFee: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      default: "pending",
    },

    payment: {
      type: Boolean,
      default: false,
    },

    // ⭐ NEW FIELD (CRITICAL)
    paymentMethod: {
      type: String,
      default: "ONLINE"
    }

  },
  { timestamps: true }
);

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;