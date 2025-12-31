// routes/discussions.js
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { verifyToken } = require("../middleware/authMiddleware");

const db = admin.firestore();

// GET all discussions with pagination and sorting
router.get("/", async (req, res) => {
  try {
    const { sortBy = "createdAt", limit = 20, lastDoc } = req.query;
    
    console.log("Fetching discussions with sortBy:", sortBy);

    let query = db.collection("discussions");

    // Fetch all first (avoid index requirement)
    const snapshot = await query.get();
    
    let discussions = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      discussions.push({
        id: doc.id,
        ...data,
        // Ensure dates are serializable
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
      });
    });

    // Sort in JavaScript
    if (sortBy === "voteCount") {
      discussions.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
    } else {
      discussions.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
    }

    // Apply pagination
    const limitNum = parseInt(limit);
    const paginatedDiscussions = discussions.slice(0, limitNum);

    res.json({
      success: true,
      discussions: paginatedDiscussions,
      hasMore: discussions.length > limitNum,
    });
  } catch (error) {
    console.error("Error fetching discussions:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch discussions" 
    });
  }
});

// GET single discussion by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection("discussions").doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: "Discussion not found" 
      });
    }

    res.json({
      success: true,
      discussion: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error("Error fetching discussion:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch discussion" 
    });
  }
});

// POST create new discussion (protected)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, content, fileUrls = [] } = req.body;

    // Validation
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: "Title must be at least 3 characters" 
      });
    }

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: "Content must be at least 10 characters" 
      });
    }

    // Get user details from your database
    // User data is already populated by middleware
    const discussionData = {
      title: title.trim(),
      content: content.trim(),
      author: {
        uid: req.user.uid,
        displayName: req.user.displayName || req.user.username || "Anonymous",
        email: req.user.email || "",
        photoURL: req.user.photoURL || null,
      },
      fileUrls: fileUrls || [],
      voteCount: 0,
      commentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("discussions").add(discussionData);

    res.status(201).json({
      success: true,
      discussion: {
        id: docRef.id,
        ...discussionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating discussion:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create discussion" 
    });
  }
});

// PUT update discussion (protected)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const docRef = db.collection("discussions").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: "Discussion not found" 
      });
    }

    const discussion = doc.data();

    // Check if user is author or admin
    if (discussion.author.uid !== req.user.uid && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to edit this discussion" 
      });
    }

    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (title) updates.title = title.trim();
    if (content) updates.content = content.trim();

    await docRef.update(updates);

    res.json({
      success: true,
      message: "Discussion updated successfully",
    });
  } catch (error) {
    console.error("Error updating discussion:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update discussion" 
    });
  }
});

// DELETE discussion (protected)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("discussions").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: "Discussion not found" 
      });
    }

    const discussion = doc.data();

    // Check if user is author or admin
    const userUid = req.user.id || req.user.userId;
    if (discussion.author.uid !== userUid && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to delete this discussion" 
      });
    }

    // Delete all comments for this discussion
    const commentsSnapshot = await db
      .collection("comments")
      .where("discussionId", "==", id)
      .get();

    const batch = db.batch();
    commentsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete all votes for this discussion
    const votesSnapshot = await db
      .collection("votes")
      .where("discussionId", "==", id)
      .get();

    votesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the discussion
    batch.delete(docRef);

    await batch.commit();

    res.json({
      success: true,
      message: "Discussion deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting discussion:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete discussion" 
    });
  }
});

// POST vote on discussion (protected)
router.post("/:id/vote", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const voteRef = db.collection("votes").doc(`${id}_${userId}`);
    const voteDoc = await voteRef.get();

    const discussionRef = db.collection("discussions").doc(id);
    const discussionDoc = await discussionRef.get();

    if (!discussionDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: "Discussion not found" 
      });
    }

    if (voteDoc.exists) {
      // Remove vote
      await voteRef.delete();
      await discussionRef.update({
        voteCount: admin.firestore.FieldValue.increment(-1),
      });

      res.json({
        success: true,
        voted: false,
        message: "Vote removed",
      });
    } else {
      // Add vote
      await voteRef.set({
        discussionId: id,
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await discussionRef.update({
        voteCount: admin.firestore.FieldValue.increment(1),
      });

      res.json({
        success: true,
        voted: true,
        message: "Vote added",
      });
    }
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process vote" 
    });
  }
});

// GET user's vote status for a discussion
router.get("/:id/vote-status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user.userId;

    const voteDoc = await db.collection("votes").doc(`${id}_${userId}`).get();

    res.json({
      success: true,
      hasVoted: voteDoc.exists,
    });
  } catch (error) {
    console.error("Error checking vote status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to check vote status" 
    });
  }
});

module.exports = router;