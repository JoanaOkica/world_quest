import Constants from "expo-constants";

/**
 * Public config, read from app.config.ts `extra`. Only values safe to ship in
 * the client bundle live here — never the Supabase service-role key.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

function required(key: string): string {
  const v = extra[key];
  if (!v) {
    throw new Error(
      `Missing config "${key}". Set EXPO_PUBLIC_* vars in apps/mobile/.env (see .env.example).`,
    );
  }
  return v;
}

export const env = {
  supabaseUrl: required("supabaseUrl"),
  supabaseAnonKey: required("supabaseAnonKey"),
  mapboxToken: extra.mapboxToken ?? "",
};
