import { Router } from "express";
import { scheduleEmail, getScheduledEmails, getSentEmails, searchEmailsHandler } from "../controllers/emailController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/schedule", scheduleEmail);
router.get("/scheduled", getScheduledEmails);
router.get("/sent", getSentEmails);
router.get("/search", searchEmailsHandler);

export default router;