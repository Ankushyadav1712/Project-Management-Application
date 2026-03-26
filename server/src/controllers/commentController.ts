import { Response } from "express";
import Comment from "../models/Comment";
import Task from "../models/Task";
import { AuthRequest } from "../middlewares/auth";

// GET /api/tasks/:taskId/comments
export const getCommentsByTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate("author", "name profilePicture")
      .sort({ createdAt: 1 });
      
    res.json({ comments });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// POST /api/tasks/:taskId/comments
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      res.status(400).json({ message: "Comment content is required" });
      return;
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const comment = await Comment.create({
      task: req.params.taskId as string,
      author: req.user!._id,
      content: content.trim()
    });

    await (comment as any).populate("author", "name profilePicture");

    res.status(201).json({ comment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    if (comment.author.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: "Not authorized to delete this comment" });
      return;
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
