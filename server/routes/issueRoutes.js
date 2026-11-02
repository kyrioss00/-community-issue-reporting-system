
const express = require("express");
const Issue = require("../models/Issue");
const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// GET: Admin dashboard statistics (Admin only)
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalReports = await Issue.countDocuments();
    const pendingReports = await Issue.countDocuments({
      status: "Pending",
    });
    const underReviewReports = await Issue.countDocuments({
      status: "Under Review",
    });
    const inProgressReports = await Issue.countDocuments({
      status: "In Progress",
    });
    const resolvedReports = await Issue.countDocuments({
      status: "Resolved",
    });
    const closedReports = await Issue.countDocuments({
      status: "Closed",
    });

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        pendingReports,
        underReviewReports,
        inProgressReports,
        resolvedReports,
        closedReports,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics.",
    });
  }
});

// POST: Submit a new community issue (Logged-in users)
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, description, category, and location.",
      });
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      location,
    });

    res.status(201).json({
      success: true,
      message: "Community issue reported successfully.",
      data: issue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit community issue.",
      error: error.message,
    });
  }
});

// GET: Retrieve all community issues (Logged-in users)
router.get("/", protect, async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve community issues.",
    });
  }
});

// PATCH: Update issue status (Admin only)
router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const allowedStatuses = [
      "Pending",
      "Under Review",
      "In Progress",
      "Resolved",
      "Closed",
    ];

    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Please select an allowed status.",
      });
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue report not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Issue status updated successfully.",
      data: issue,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid issue report ID.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update issue status.",
    });
  }
});

module.exports = router;
