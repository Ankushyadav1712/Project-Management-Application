import { Router } from "express";
import {
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskController";
import {
  getCommentsByTask,
  addComment
} from "../controllers/commentController";
import { protect } from "../middlewares/auth";

const router = Router();

router.use(protect);

router.get("/:id", getTaskById);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

router.get("/:taskId/comments", getCommentsByTask);
router.post("/:taskId/comments", addComment);

export default router;
