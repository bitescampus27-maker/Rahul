// ================================
// server.js (FINAL CLEAN VERSION)
// ================================

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Database + Routes
import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import foodRouter from "./routes/foodRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import posRoutes from "./routes/posRoutes.js";
import settingsRoute from "./routes/settingsRoute.js";
import reportRoutes from "./routes/reportRoutes.js";
import categoryRouter from "./routes/categoryRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================
// FIX __dirname (ES MODULE SUPPORT)
// =====================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================
// CORS CONFIGURATION
// =====================================

app.use(
  cors({
    origin: [
      "http://localhost:5173", // frontend
      "http://localhost:5174", // admin panel
    ],
    credentials: true,
  })
);

app.use(express.json());

// =====================================
// ADMIN ACCESS CODE SYSTEM
// =====================================

const ownersFilePath = path.join(__dirname, "owners.json");

function loadOwners() {
  if (!fs.existsSync(ownersFilePath)) {
    fs.writeFileSync(ownersFilePath, "[]");
  }
  return JSON.parse(fs.readFileSync(ownersFilePath));
}

function saveOwners(data) {
  fs.writeFileSync(ownersFilePath, JSON.stringify(data, null, 2));
}

function generateAdminCode() {
  return "ADM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Generate admin code
app.post("/api/admin/generate", (req, res) => {
  const { ownerName } = req.body;

  if (!ownerName) {
    return res.status(400).json({
      success: false,
      message: "ownerName required",
    });
  }

  const owners = loadOwners();
  const code = generateAdminCode();

  owners.push({ ownerName, code });
  saveOwners(owners);

  res.json({ success: true, ownerName, code });
});

// Verify admin login
app.post("/api/admin/verify", (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Code required",
    });
  }

  const owners = loadOwners();
  const match = owners.find((o) => o.code === code);

  if (!match) return res.json({ success: false });

  res.json({ success: true });
});

// =====================================
// STATIC IMAGE SERVING
// =====================================

// Serve ALL uploaded images from /uploads
app.use("/images", express.static(path.join(__dirname, "uploads")));

// =====================================
// API ROUTES
// =====================================

app.use("/api/user", userRouter);
app.use("/api/food", foodRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/settings", settingsRoute);
app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRouter);

// =====================================
// CONNECT DATABASE
// =====================================

connectDB();

// Test Route
app.get("/", (req, res) => {
  res.send("API Working — Server Online ✔");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
