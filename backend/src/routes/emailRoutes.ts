import { Router } from "express";
import { scheduleEmail, getScheduledEmails, getSentEmails, searchEmailsHandler, deleteEmail } from "../controllers/emailController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/schedule", scheduleEmail);
router.get("/scheduled", getScheduledEmails);
router.get("/sent", getSentEmails);
router.get("/search", searchEmailsHandler);
router.delete("/:id", deleteEmail);

export default router;