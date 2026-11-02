const express = require("express");
const User = require("../models/User");
const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// GET: Retrieve all registered users (Admin only)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve registered users.",
    });
  }
});

// PATCH: Update a user's role (Admin only)
router.patch("/:id/role", protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;

    const allowedRoles = ["resident", "admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Choose resident or admin.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      data: user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update user role.",
    });
  }
});


// DELETE: Remove a user account (Admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    // Prevent administrators from deleting their own account
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User account deleted successfully.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete user account.",
    });
  }
});

module.exports = router;