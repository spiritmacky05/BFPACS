/**
 * Central API configuration.
 * ALL API-related environment variables and constants should be defined here.
 */

export const API_BASE = import.meta.env.VITE_API_URL || '/v1';

export default {
  API_BASE,
};
