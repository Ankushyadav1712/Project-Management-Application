import { Response } from "express";
import Workspace from "../models/Workspace";
import Task from "../models/Task";
import Project from "../models/Project";
import { AuthRequest } from "../middlewares/auth";
import mongoose from "mongoose";

// POST /api/workspaces
export const createWorkspace = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = req.user!._id;

    const workspace = await Workspace.create({
      name,
      description,
      owner: userId,
      members: [{ user: userId, role: "owner" }],
    });

    res.status(201).json({ workspace });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET /api/workspaces
export const getWorkspaces = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const workspaces = await Workspace.find({
      "members.user": userId,
    }).populate("owner", "name email profilePicture");

    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET /api/workspaces/:id
export const getWorkspaceById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("owner", "name email profilePicture")
      .populate("members.user", "name email profilePicture");

    if (!workspace) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }

    // Check membership
    const isMember = workspace.members.some(
      (m) =>
        m.user._id.toString() === req.user!._id.toString()
    );
    if (!isMember) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// PATCH /api/workspaces/:id
export const updateWorkspace = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }

    if (workspace.owner.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: "Only the owner can update this workspace" });
      return;
    }

    workspace.name = name || workspace.name;
    workspace.description = description ?? workspace.description;
    await workspace.save();

    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE /api/workspaces/:id
export const deleteWorkspace = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }

    if (workspace.owner.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: "Only the owner can delete this workspace" });
      return;
    }

    await workspace.deleteOne();
    res.json({ message: "Workspace deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET /api/workspaces/:id/analytics
export const getWorkspaceAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const workspaceId = new mongoose.Types.ObjectId(req.params.id as string);

    const totalProjects = await Project.countDocuments({ workspace: workspaceId });
    const totalTasks = await Task.countDocuments({ workspace: workspaceId });
    const todoTasks = await Task.countDocuments({ workspace: workspaceId, status: "todo" });
    const inProgressTasks = await Task.countDocuments({ workspace: workspaceId, status: "in-progress" });
    const doneTasks = await Task.countDocuments({ workspace: workspaceId, status: "done" });

    const recentTasks = await Task.find({ workspace: workspaceId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignedTo", "name profilePicture")
      .populate("project", "name emoji");

    res.json({
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
