import { Response } from "express";
import Task from "../models/Task";
import Project from "../models/Project";
import { AuthRequest } from "../middlewares/auth";

// GET /api/search?q=...&workspaceId=...
export const globalSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, workspaceId } = req.query;
    
    if (!q || typeof q !== "string" || !workspaceId) {
      res.json({ projects: [], tasks: [] });
      return;
    }

    const queryRegex = new RegExp(q, "i");

    // Search Projects
    const projects = await Project.find({
      workspace: workspaceId,
      name: { $regex: queryRegex }
    }).limit(5);

    // Search Tasks
    const tasks = await Task.find({
      workspace: workspaceId,
      $or: [
        { title: { $regex: queryRegex } },
        { description: { $regex: queryRegex } }
      ]
    })
      .populate("project", "name emoji")
      .limit(10);

    res.json({ projects, tasks });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
