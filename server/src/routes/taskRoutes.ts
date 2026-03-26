import { Router } from "express";
import {
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskController";
import { protect } from "../middlewares/auth";

const router = Router();

router.use(protect);

router.get("/:id", getTaskById);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
