import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../config/redis.js";

// Auth Limiter ke liye alag store
const authStore = new RedisStore({
  sendCommand: (...args) => redis.call(...args),
  prefix: "rl-auth:", // Isse Redis mein keys 'rl-auth:' se start hongi
});

// General Limiter ke liye alag store
const generalStore = new RedisStore({
  sendCommand: (...args) => redis.call(...args),
  prefix: "rl-gen:", // Isse Redis mein keys 'rl-gen:' se start hongi
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    store: authStore, // Use authStore here
    message: { success: false, message: "Too many attempts, try after 15 mins" },
    standardHeaders: true,
    legacyHeaders: false,
});

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    store: generalStore, // Use generalStore here
    standardHeaders: true,
    legacyHeaders: false,
});