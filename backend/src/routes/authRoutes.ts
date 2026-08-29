import { Router } from "express";
import passport from "../config/passport";
import { env } from "../config/env";

const router = Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${env.FRONTEND_URL}/login?error=1` }),
  (req, res) => {
    // Successful login — send them back to the frontend dashboard.
    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  }
);

router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: req.user });
});

router.post("/logout", (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

export default router;