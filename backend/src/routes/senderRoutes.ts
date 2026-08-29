import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getSenders, createSender } from "../controllers/senderController";

const router = Router();

// All sender routes require authentication
router.use(requireAuth);

router.get("/", getSenders);
router.post("/", createSender);

export default router;
