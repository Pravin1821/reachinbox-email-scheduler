import { Router } from "express";
import { scheduleEmail, getScheduledEmails, getSentEmails, searchEmailsHandler } from "../controllers/emailController";

const router = Router();

router.post("/schedule", scheduleEmail);
router.get("/scheduled", getScheduledEmails);
router.get("/sent", getSentEmails);
router.get("/search", searchEmailsHandler);

export default router;