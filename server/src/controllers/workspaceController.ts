import { Response } from "express";
import Workspace from "../models/Workspace";
import Task from "../models/Task";
import Project from "../models/Project";
import User from "../models/User";
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

    const tasksByPriority = await Task.aggregate([
      { $match: { workspace: workspaceId } },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const tasksPerProject = await Task.aggregate([
      { $match: { workspace: workspaceId } },
      { $group: { _id: "$project", count: { $sum: 1 } } },
      { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $project: { name: "$project.name", count: 1, _id: 0 } }
    ]);

    res.json({
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      recentTasks,
      tasksByPriority,
      tasksPerProject,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// POST /api/workspaces/:id/members
export const addWorkspaceMember = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, role = "member" } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }

    const currentMember = workspace.members.find(
      (m) => m.user.toString() === req.user!._id.toString()
    );
    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      res.status(403).json({ message: "Not authorized to add members" });
      return;
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      res.status(404).json({ message: "User with this email not found" });
      return;
    }

    if (workspace.members.some((m) => m.user.toString() === userToAdd._id.toString())) {
      res.status(400).json({ message: "User is already a member" });
      return;
    }

    workspace.members.push({ user: userToAdd._id, role, joinedAt: new Date() });
    await workspace.save();
    await workspace.populate("members.user", "name email profilePicture");

    res.json({ message: "Member added successfully", workspace });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE /api/workspaces/:id/members/:memberId
export const removeWorkspaceMember = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }

    const currentMember = workspace.members.find(
      (m) => m.user.toString() === req.user!._id.toString()
    );
    
    const isSelfRemove = req.user!._id.toString() === req.params.memberId;
    if (!isSelfRemove && (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin"))) {
      res.status(403).json({ message: "Not authorized to remove members" });
      return;
    }

    const targetMember = workspace.members.find(m => m.user.toString() === req.params.memberId);
    if (targetMember?.role === "owner" && !isSelfRemove) {
      res.status(400).json({ message: "Cannot remove the workspace owner" });
      return;
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== req.params.memberId
    );
    await workspace.save();

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
