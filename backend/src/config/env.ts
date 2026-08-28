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
};