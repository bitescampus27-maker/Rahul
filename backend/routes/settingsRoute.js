import express from "express";
import SettingsModel from "../models/settingsModel.js";

const router = express.Router();

/* ============================
   GET ALL SETTINGS
============================ */
router.get("/", async (req, res) => {
  try {
    let settings = await SettingsModel.findOne();

    if (!settings) {
      settings = await SettingsModel.create({
        deliveryFee: 10,
        kitchenOpen: true
      });
    }

    res.json({
      success: true,
      deliveryFee: settings.deliveryFee,
      kitchenOpen: settings.kitchenOpen
    });

  } catch (error) {
    console.error("Error fetching settings:", error);
    res.json({ success: false, message: "Failed to fetch settings" });
  }
});


/* ============================
   UPDATE DELIVERY FEE
============================ */
router.post("/update-delivery-fee", async (req, res) => {
  try {
    const { deliveryFee } = req.body;

    if (deliveryFee === undefined || isNaN(deliveryFee)) {
      return res.json({ success: false, message: "Invalid delivery fee" });
    }

    let settings = await SettingsModel.findOne();

    if (!settings) {
      settings = await SettingsModel.create({ deliveryFee });
    } else {
      settings.deliveryFee = deliveryFee;
      await settings.save();
    }

    res.json({
      success: true,
      deliveryFee: settings.deliveryFee
    });

  } catch (error) {
    console.error("Error updating settings:", error);
    res.json({ success: false, message: "Failed to update settings" });
  }
});


/* ============================
   TOGGLE KITCHEN STATUS
============================ */
router.post("/toggle-kitchen", async (req, res) => {
  try {
    let settings = await SettingsModel.findOne();

    if (!settings) {
      settings = await SettingsModel.create({
        deliveryFee: 10,
        kitchenOpen: true
      });
    }

    settings.kitchenOpen = !settings.kitchenOpen;
    await settings.save();

    res.json({
      success: true,
      kitchenOpen: settings.kitchenOpen
    });

  } catch (error) {
    console.error("Error toggling kitchen:", error);
    res.json({ success: false, message: "Failed to toggle kitchen" });
  }
});

export default router;