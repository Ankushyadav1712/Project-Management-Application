import { Response } from "express";
import Project from "../models/Project";
import Workspace from "../models/Workspace";
import Task from "../models/Task";
import { AuthRequest } from "../middlewares/auth";

// POST /api/workspaces/:workspaceId/projects
export const createProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { name, description, emoji } = req.body;
    const userId = req.user!._id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }

    const isMember = workspace.members.some(
      (m) => m.user.toString() === userId.toString()
    );
    if (!isMember) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const project = await Project.create({
      name,
      description,
      emoji: emoji || "📋",
      workspace: String(workspaceId),
      createdBy: userId,
    });

    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET /api/workspaces/:workspaceId/projects
export const getProjectsByWorkspace = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const projects = await Project.find({ workspace: workspaceId })
      .populate("createdBy", "name profilePicture")
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET /api/projects/:id
export const getProjectById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "createdBy",
      "name profilePicture"
    );

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// PATCH /api/projects/:id
export const updateProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description, emoji } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    project.name = name || project.name;
    project.description = description ?? project.description;
    project.emoji = emoji || project.emoji;
    await project.save();

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: "Project and its tasks deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
