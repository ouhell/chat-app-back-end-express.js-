import { config } from "dotenv";
import z from "zod";

config();

const envTemplate = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  DATABASE_CONNECTION_URI: z.string(),
  ENCRYPTING_VECTOR: z.string(),
  ENCRYPTING_SECURITY_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_S3_BUCKET_NAME: z.string(),
  AWS_S3_ENDPOINT: z.string().optional(),
  AWS_S3_FORCE_PATH_STYLE: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  CLIENT_ORIGIN: z.string().optional(),
});

export const ENV = envTemplate.parse(process.env);
