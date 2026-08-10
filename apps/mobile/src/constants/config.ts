const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_API_URL. Configure it in apps/mobile/.env.local (see .env.example)."
  );
}

export const API_URL = apiUrl;
