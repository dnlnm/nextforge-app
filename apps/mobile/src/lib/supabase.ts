import "react-native-url-polyfill";

import { createClient } from "@supabase/supabase-js";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!(supabaseUrl && supabaseAnonKey)) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Configure them in apps/mobile/.env.local (see .env.example)."
  );
}

const isNative = Platform.OS !== "web";

// On native we persist the session to the OS keychain via expo-secure-store.
// On web the Supabase client falls back to its default localStorage backend.
const authOptions = isNative
  ? {
      storage: {
        getItem: (key: string) => getItemAsync(key),
        setItem: (key: string, value: string) => setItemAsync(key, value),
        removeItem: (key: string) => deleteItemAsync(key),
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    }
  : {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
});
