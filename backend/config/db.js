import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://bitescampus27_db_user:12345@cluster0.4nt9w8n.mongodb.net/food-delivery'); // ⭐ UPDATED: Added database name (replace 'food-delivery' with your actual DB name if different)
        console.log("DB Connected");
    } catch (error) {
        console.error("DB Connection Error:", error.message); // ⭐ NEW: Log errors for debugging
        process.exit(1); // Exit on failure to prevent app from running without DB
    }
};