import { Router } from "express";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import {
  createTask,
  getTasksByProject,
} from "../controllers/taskController";
import { protect } from "../middlewares/auth";

const router = Router();

router.use(protect);

router.get("/:id", getProjectById);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);

// Tasks nested under project
router.post("/:projectId/tasks", createTask);
router.get("/:projectId/tasks", getTasksByProject);

export default router;
