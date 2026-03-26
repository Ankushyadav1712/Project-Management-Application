import { Response } from "express";
import Task from "../models/Task";
import { AuthRequest } from "../middlewares/auth";

// POST /api/projects/:projectId/tasks
export const createTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, dueDate, assignedTo, workspaceId } = req.body;
    const userId = req.user!._id;

    const taskDoc = new Task({
      title,
      description,
      status: status || "todo",
      priority: priority || "medium",
      dueDate,
      project: projectId,
      workspace: workspaceId,
      assignedTo,
      createdBy: userId,
    });
    await taskDoc.save();
    await taskDoc.populate("assignedTo", "name profilePicture");

    res.status(201).json({ task: taskDoc });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET /api/projects/:projectId/tasks
export const getTasksByProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name profilePicture")
      .populate("createdBy", "name profilePicture")
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET /api/tasks/:id
export const getTaskById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name profilePicture")
      .populate("createdBy", "name profilePicture")
      .populate("project", "name emoji")
      .populate("workspace", "name");

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// PATCH /api/tasks/:id
export const updateTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;

    await task.save();
    await (task as InstanceType<typeof Task>).populate("assignedTo", "name profilePicture");

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
