const DEFAULT_API_URL = 'http://localhost:3000';
const fromEnv = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_API_URL;
