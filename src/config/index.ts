import 'dotenv/config'

export const env = {
  PORT: Number(process.env.PORT),
  DB_URL: String(process.env.DB_URL),
  REDIS_URL: String(process.env.REDIS_URL),

  SUPERADMIN: {
    PHONE: String(process.env.SUPERADMIN_PHONE),
    PASSWORD: String(process.env.SUPERADMIN_PASSWORD),
  },

  TOKEN: {
    ACCESS_KEY: String(process.env.TOKEN_ACCESS_KEY),
    ACCESS_TIME: String(process.env.TOKEN_ACCESS_TIME),
    REFRESH_KEY: String(process.env.TOKEN_REFRESH_KEY),
    REFRESH_TIME: String(process.env.TOKEN_REFRESH_TIME),
  },

  OTP: {
    SECRET: String(process.env.OTP_SECRET),
    TTL: Number(process.env.OTP_TTL),
    RESEND: Number(process.env.OTP_RESEND),
    ATTEMPTS: Number(process.env.OTP_ATTEMPTS),
  },
};