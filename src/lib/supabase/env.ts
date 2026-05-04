const PLACEHOLDER_PREFIXES = ["your_", "sk_test_your_", "pk_test_your_", "whsec_your_", "price_your_"];

function isPlaceholder(value: string | undefined) {
  if (!value) return true;

  return PLACEHOLDER_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function isValidHttpUrl(value: string | undefined) {
  if (!value || isPlaceholder(value)) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSupabaseConfigured() {
  return (
    isValidHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function isSupabaseServiceRoleConfigured() {
  return isSupabaseConfigured() && !isPlaceholder(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseConfigError() {
  return "Supabase is not configured. Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.";
}
