import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

declare global {
  namespace Express {
    interface User extends SessionUser {}
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const user: SessionUser = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value || "",
        avatar: profile.photos?.[0]?.value || "",
      };
      done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

export default passport;