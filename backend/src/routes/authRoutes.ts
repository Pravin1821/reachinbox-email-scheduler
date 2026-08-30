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

router.post("/login", (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const namePart = cleanEmail.split("@")[0] || "User";
  const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const user = {
    id: `usr_${Buffer.from(cleanEmail).toString("hex").slice(0, 10)}`,
    name: displayName,
    email: cleanEmail,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
  };

  req.login(user, (err) => {
    if (err) {
      console.error("[auth] login error:", err);
      return res.status(500).json({ error: "Failed to establish session" });
    }
    return res.json({ user });
  });
});

router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: req.user });
});

router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session?.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
});

export default router;