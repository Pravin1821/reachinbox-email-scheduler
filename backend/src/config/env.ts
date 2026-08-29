import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const env = {
  PORT: process.env.PORT || "4000",
  DATABASE_URL: required("DATABASE_URL"),
  REDIS_URL: required("REDIS_URL"),
  ETHEREAL_USER: required("ETHEREAL_USER"),
  ETHEREAL_PASS: required("ETHEREAL_PASS"),
  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CALLBACK_URL: required("GOOGLE_CALLBACK_URL"),
  SESSION_SECRET: required("SESSION_SECRET"),
  SLACK_CLIENT_ID: required("SLACK_CLIENT_ID"),
  SLACK_CLIENT_SECRET: required("SLACK_CLIENT_SECRET"),
  SLACK_REDIRECT_URI: required("SLACK_REDIRECT_URI"),
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};