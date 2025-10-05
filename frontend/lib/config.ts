// API base URL configuration
let API_URL = process.env.EXPO_PUBLIC_API_URL as string | undefined;
if (!API_URL || API_URL.trim().length === 0) {
  API_URL = 'http://127.0.0.1:8000/api/v1';
}

// Debug: log API base once at startup (safe; no secrets)
if (!API_URL) {
  // eslint-disable-next-line no-console
  console.warn('EXPO_PUBLIC_API_URL is not set');
} else {
  // eslint-disable-next-line no-console
  console.log('EXPO_PUBLIC_API_URL:', API_URL);
}

export { API_URL };

