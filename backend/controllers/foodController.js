import foodModel from "../models/foodModel.js";
import fs from "fs";

/* ================= ADD FOOD ================= */
const addFood = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    if (!req.file) {
      return res.json({
        success: false,
        message: "Image is required",
      });
    }

    const newFood = new foodModel({
      name,
      description,
      price,
      category,
      image: req.file.filename,
      isActive: true
    });

    await newFood.save();

    res.json({
      success: true,
      message: "Food added successfully",
    });

  } catch (error) {
    console.error("ADD FOOD ERROR:", error);
    res.json({
      success: false,
      message: "Error adding food",
    });
  }
};

/* ================= LIST ACTIVE FOOD (USER) ================= */
const listFood = async (req, res) => {
  try {

    const isAdmin = req.query.admin === "true";

    let foods;

    if (isAdmin) {
      // 🔥 Admin sees ALL foods
      foods = await foodModel
        .find({})
        .populate("category")
        .sort({ createdAt: -1 });
    } else {
      // 🔥 User sees ONLY active foods
      foods = await foodModel
        .find({ isActive: true })
        .populate("category")
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: foods,
    });

  } catch (error) {
    console.error("LIST FOOD ERROR:", error);
    res.json({
      success: false,
      message: "Error fetching food list",
    });
  }
};

/* ================= REMOVE FOOD ================= */
const removeFood = async (req, res) => {
  try {
    const { id } = req.body;

    const food = await foodModel.findById(id);

    if (!food) {
      return res.json({
        success: false,
        message: "Food not found",
      });
    }

    // Delete image file
    if (food.image) {
      fs.unlink(`uploads/${food.image}`, (err) => {
        if (err) console.log("Image delete error:", err);
      });
    }

    await foodModel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Food removed successfully",
    });

  } catch (error) {
    console.error("REMOVE FOOD ERROR:", error);
    res.json({
      success: false,
      message: "Error removing food",
    });
  }
};

/* ================= UPDATE FOOD ================= */
const updateFood = async (req, res) => {
  try {
    const { id, name, description, price, category } = req.body;

    const food = await foodModel.findById(id);

    if (!food) {
      return res.json({
        success: false,
        message: "Food not found",
      });
    }

    // If new image uploaded, delete old one
    if (req.file) {
      if (food.image) {
        fs.unlink(`uploads/${food.image}`, (err) => {
          if (err) console.log("Image delete error:", err);
        });
      }
      food.image = req.file.filename;
    }

    food.name = name;
    food.description = description;
    food.price = price;
    food.category = category;

    await food.save();

    res.json({
      success: true,
      message: "Food updated successfully",
    });

  } catch (error) {
    console.error("UPDATE FOOD ERROR:", error);
    res.json({
      success: false,
      message: "Error updating food",
    });
  }
};

/* ================= TOGGLE FOOD STATUS ================= */
const toggleFoodStatus = async (req, res) => {
  try {
    const { id } = req.body;

    const food = await foodModel.findById(id);

    if (!food) {
      return res.json({
        success: false,
        message: "Food not found",
      });
    }

    food.isActive = !food.isActive;
    await food.save();

    res.json({
      success: true,
      message: `Food ${food.isActive ? "resumed" : "paused"} successfully`,
      isActive: food.isActive
    });

  } catch (error) {
    console.error("TOGGLE STATUS ERROR:", error);
    res.json({
      success: false,
      message: "Error updating food status",
    });
  }
};

export {
  addFood,
  listFood,
  removeFood,
  updateFood,
  toggleFoodStatus
};
