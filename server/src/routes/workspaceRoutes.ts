import { Router } from "express";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceAnalytics,
} from "../controllers/workspaceController";
import {
  createProject,
  getProjectsByWorkspace,
} from "../controllers/projectController";
import { protect } from "../middlewares/auth";

const router = Router();

router.use(protect);

router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:id", getWorkspaceById);
router.patch("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);
router.get("/:id/analytics", getWorkspaceAnalytics);

// Projects nested under workspace
router.post("/:workspaceId/projects", createProject);
router.get("/:workspaceId/projects", getProjectsByWorkspace);

export default router;
