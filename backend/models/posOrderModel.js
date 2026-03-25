import mongoose from "mongoose";

const PosOrderSchema = new mongoose.Schema(
  {

    /* ================= ORDER NUMBER ================= */
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },

    /* ================= ORDER ITEMS ================= */
    items: [
      {
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],

    /* ================= TOTAL AMOUNT ================= */
    totalAmount: {
      type: Number,
      required: true,
    },

    /* ================= ORDER TYPE ================= */
    orderType: {
      type: String,
      enum: ["dine-in", "takeaway"],
      default: "dine-in",
    },

    /* ================= CUSTOMER INFO ================= */
    customerName: {
      type: String,
      default: "Walk-in",
    },

    customerPhone: {
      type: String,
    },

    /* ================= PAYMENT ================= */
   paymentMethod: {
  type: String,
  enum: ["cash", "upi"],
  default: "cash"
},

    /* ================= ORDER STATUS ================= */
    // ⭐ NO delivered in ENUM because DB should NOT store delivered
    status: {
      type: String,
      enum: ["accepted", "preparing", "prepared"],
      default: "preparing",
    },

    /* ================= PAYMENT STATUS ================= */
    isPaid: {
      type: Boolean,
      default: true,
    },

  },
  { timestamps: true }
);

const PosOrder = mongoose.model("PosOrder", PosOrderSchema);

export default PosOrder;  