const dotenv = require('dotenv')

let ENV_FILE_NAME = '';
switch (process.env.NODE_ENV) {
  case 'production':
    ENV_FILE_NAME = '.env.production';
    break;
  case 'staging':
    ENV_FILE_NAME = '.env.staging';
    break;
  case 'test':
    ENV_FILE_NAME = '.env.test';
    break;
  case 'development':
  default:
    ENV_FILE_NAME = '.env';
    break;
}

try {
  dotenv.config({ path: process.cwd() + '/' + ENV_FILE_NAME });
} catch (e) {
}

// CORS when consuming Medusa from admin
const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001";

// CORS to avoid issues when consuming Medusa from a client
const STORE_CORS = process.env.STORE_CORS || "http://localhost:8000";

// Database URL (here we use a local database called medusa-store)
const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost/medusa-store";

// Medusa uses Redis, so this needs configuration as well
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Stripe keys
const STRIPE_API_KEY = process.env.STRIPE_API_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Razorpay keys
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

// Twilio keys
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "";

// SendGrid keys
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "something";

// Cookie Secret
const COOKIE_SECRET = process.env.COOKIE_SECRET || "something";

// Sentry
const SENTRY_DSN = process.env.SENTRY_DSN || "";

// File service
const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || "http://localhost:9000";

// Price feed service
const PRICE_FEED_URL = process.env.PRICE_FEED_URL || "http://localhost:9001";

// Vault service
const VAULT_SERVICE_URL = process.env.VAULT_SERVICE_URL || "http://localhost:9002";

const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  {
    resolve: `medusa-file-local`,
    options: {
      upload_dir: "uploads",
    },
  },
  {
    resolve: "@medusajs/admin",
    options: {
      autoRebuild: true,
      develop: {
        open: process.env.OPEN_BROWSER !== "false",
      },
    },
  },
  {
    resolve: `medusa-plugin-sendgrid`,
    options: {
      api_key: SENDGRID_API_KEY,
      from: SENDGRID_FROM_EMAIL,
    },
  },
  {
    resolve: `medusa-plugin-twilio-sms`,
    options: {
      account_sid: TWILIO_ACCOUNT_SID,
      auth_token: TWILIO_AUTH_TOKEN,
      from: TWILIO_PHONE_NUMBER,
    },
  },
  {
    resolve: `medusa-plugin-stripe`,
    options: {
      api_key: STRIPE_API_KEY,
      webhook_secret: STRIPE_WEBHOOK_SECRET,
    },
  },
  {
    resolve: `medusa-plugin-sentry`,
    options: {
      dsn: SENTRY_DSN,
    },
  },
  {
    resolve: `medusa-plugin-redis`,
    options: {
      redis_url: REDIS_URL,
    },
  },
];

const modules = {
  eventBus: {
    resolve: "@medusajs/event-bus-redis",
    options: {
      redisUrl: REDIS_URL,
    },
  },
  cache: {
    resolve: "@medusajs/cache-redis",
    options: {
      redisUrl: REDIS_URL,
    },
  },
};

/** @type {import('@medusajs/medusa').Config} */
const config = {
  projectConfig: {
    redis_url: REDIS_URL,
    database_url: DATABASE_URL,
    database_type: "postgres",
    store_cors: STORE_CORS,
    admin_cors: ADMIN_CORS,
    jwt_secret: JWT_SECRET,
    cookie_secret: COOKIE_SECRET,
    database_extra: { ssl: { rejectUnauthorized: false } },
  },
  plugins,
  modules,
};

module.exports = {
  config,
}; 