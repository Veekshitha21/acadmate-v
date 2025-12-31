// routes/comments.js
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { verifyToken } = require("../middleware/authMiddleware");

const db = admin.firestore();

// GET comments for a discussion
router.get("/discussion/:discussionId", async (req, res) => {
  try {
    const { discussionId } = req.params;

    console.log("Fetching comments for discussion:", discussionId);

    // First, try without ordering to avoid index requirement
    let snapshot;
    try {
      snapshot = await db
        .collection("comments")
        .where("discussionId", "==", discussionId)
        .get();
      
      console.log("Found comments (unordered):", snapshot.size);
    } catch (indexError) {
      console.error("Firestore query error:", indexError.message);
      
      // If index is missing, return empty array instead of error
      return res.json({
        success: true,
        comments: [],
        totalCount: 0,
        message: "Comments collection may need indexing. Check Firestore console."
      });
    }

    const comments = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        // Ensure dates are serializable
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
      });
    });

    // Sort in JavaScript instead of Firestore
    comments.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateA - dateB;
    });

    // Build nested structure
    const commentMap = {};
    const rootComments = [];

    comments.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    comments.forEach((comment) => {
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies.push(commentMap[comment.id]);
      } else if (!comment.parentId) {
        rootComments.push(commentMap[comment.id]);
      }
    });

    res.json({
      success: true,
      comments: rootComments,
      totalCount: comments.length,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch comments" 
    });
  }
});

// POST create new comment (protected)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { discussionId, content, parentId = null } = req.body;

    if (!content || content.trim().length < 1) {
      return res.status(400).json({ 
        success: false, 
        message: "Comment cannot be empty" 
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({ 
        success: false, 
        message: "Comment too long (max 5000 characters)" 
      });
    }

    // Verify discussion exists
    const discussionDoc = await db.collection("discussions").doc(discussionId).get();
    if (!discussionDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: "Discussion not found" 
      });
    }

    // If parentId provided, verify parent comment exists
    if (parentId) {
      const parentDoc = await db.collection("comments").doc(parentId).get();
      if (!parentDoc.exists) {
        return res.status(404).json({ 
          success: false, 
          message: "Parent comment not found" 
        });
      }
    }

    // Get user details from middleware
    const commentData = {
      discussionId,
      content: content.trim(),
      parentId,
      author: {
        uid: req.user.uid,
        displayName: req.user.displayName || req.user.username || "Anonymous",
        photoURL: req.user.photoURL || null,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("comments").add(commentData);

    // Update discussion comment count
    await db.collection("discussions").doc(discussionId).update({
      commentCount: admin.firestore.FieldValue.increment(1),
    });

    res.status(201).json({
      success: true,
      comment: {
        id: docRef.id,
        ...commentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create comment" 
    });
  }
});

// PUT update comment (protected)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length < 1) {
      return res.status(400).json({ 
        success: false, 
        message: "Comment cannot be empty" 
      });
    }

    const docRef = db.collection("comments").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: "Comment not found" 
      });
    }

    const comment = doc.data();

    // Check if user is author or admin
    if (comment.author.uid !== req.user.uid && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to edit this comment" 
      });
    }

    await docRef.update({
      content: content.trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      message: "Comment updated successfully",
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update comment" 
    });
  }
});

// DELETE comment (protected)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("comments").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: "Comment not found" 
      });
    }

    const comment = doc.data();

    // Check if user is author or admin
    const userUid = req.user.id || req.user.userId;
    if (comment.author.uid !== userUid && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to delete this comment" 
      });
    }

    // Delete comment and all replies recursively
    const deleteRecursive = async (commentId) => {
      const repliesSnapshot = await db
        .collection("comments")
        .where("parentId", "==", commentId)
        .get();

      const batch = db.batch();

      for (const replyDoc of repliesSnapshot.docs) {
        await deleteRecursive(replyDoc.id);
        batch.delete(replyDoc.ref);
      }

      await batch.commit();
    };

    await deleteRecursive(id);
    await docRef.delete();

    // Update discussion comment count
    const totalDeleted = 1 + (await countReplies(id));
    await db.collection("discussions").doc(comment.discussionId).update({
      commentCount: admin.firestore.FieldValue.increment(-totalDeleted),
    });

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete comment" 
    });
  }
});

// Helper function to count replies
async function countReplies(commentId) {
  const snapshot = await db
    .collection("comments")
    .where("parentId", "==", commentId)
    .get();

  let count = snapshot.size;

  for (const doc of snapshot.docs) {
    count += await countReplies(doc.id);
  }

  return count;
}

module.exports = router;