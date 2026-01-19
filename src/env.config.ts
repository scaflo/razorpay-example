import dotenv from "dotenv";
dotenv.config();

const envConfig = {
  PORT: process.env.PORT || 4500,
  RAZOR_KEY_ID: process.env.RAZOR_KEY_ID!,
  RAZOR_KEY_SECRET: process.env.RAZOR_KEY_SECRET!,
  RAZOR_WEBHOOK_SECRET: process.env.RAZOR_WEBHOOK_SECRET!,

  NODE_ENV: process.env.NODE_ENV,
};
export default envConfig;
