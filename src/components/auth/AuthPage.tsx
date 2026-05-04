"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe,
  Loader2,
  Lock,
  Sparkles,
  TrendingUp,
  UserPlus,
  WandSparkles,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getSupabaseConfigError,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import {
  POPULAR_SOCIAL_COUNTRIES,
  TOP_SOCIAL_COUNTRIES,
  type CountryTheme,
} from "@/data/countries";
import { useTheme } from "./ThemeContext";

type AuthMode = "login" | "signup" | "reset";
type OAuthProvider = "google" | "twitter";

const SOCIAL_PROVIDERS = [
  {
    id: "google" as OAuthProvider,
    label: "Continue with YouTube / Google",
    icon: "🎬",
    className: "bg-white/6 text-white hover:bg-white/10",
  },
  {
    id: "twitter" as OAuthProvider,
    label: "Continue with Twitter / X",
    icon: "𝕏",
    className: "bg-white/6 text-white hover:bg-white/10",
  },
];

const CUSTOM_PROVIDERS = [
  {
    id: "tiktok",
    label: "Continue with TikTok",
    icon: "🎵",
    href: "/api/auth/tiktok",
  },
  {
    id: "instagram",
    label: "Continue with Instagram",
    icon: "📸",
    href: "/api/auth/instagram",
  },
];

const SOCIAL_PROOF = [
  "Localized onboarding for creator-first markets",
  "Flag-powered color accents with smooth 0.5s transitions",
  "Built to feel native from Nairobi to New York",
];

const OTHER_SOCIAL_COUNTRIES = TOP_SOCIAL_COUNTRIES.filter(
  (country) => !country.popular
);

function CountryOption({
  country,
  selected,
  onSelect,
}: {
  country: CountryTheme;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(country.code)}
      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${
        selected
          ? "border-white/25 bg-white/12 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          : "border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/8"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="text-xl">{country.flag}</span>
        <span>
          <span className="block text-sm font-medium text-white">{country.name}</span>
          <span className="block text-xs uppercase tracking-[0.22em] text-white/45">
            {country.code}
          </span>
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: country.primaryColor }}
        />
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: country.secondaryColor }}
        />
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: country.accentColor }}
        />
      </span>
    </button>
  );
}

function CountrySelector() {
  const { selectedCountry, setSelectedCountryCode } = useTheme();
  const [open, setOpen] = useState(false);

  const handleSelect = (code: string) => {
    setSelectedCountryCode(code);
    setOpen(false);
  };

  return (
    <>
      <div className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.24em] text-white/55">
          Country vibe
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition-all duration-500 hover:border-white/20 hover:bg-white/8"
        >
          <span className="flex items-center gap-3">
            <span className="text-2xl">{selectedCountry.flag}</span>
            <span>
              <span className="block text-sm font-medium">{selectedCountry.name}</span>
              <span className="block text-xs text-white/50">
                Theme follows the market you create for
              </span>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-white/60" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#08101f]/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  Choose your creator market
                </p>
                <p className="text-xs text-white/55">
                  Top 50 countries pre-filtered for social engagement
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/20 hover:text-white"
                aria-label="Close country selector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(85vh-73px)] overflow-y-auto px-5 py-5">
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.28em] text-white/45">
                  <Sparkles className="h-3.5 w-3.5" />
                  Popular markets
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {POPULAR_SOCIAL_COUNTRIES.map((country) => (
                    <CountryOption
                      key={country.code}
                      country={country}
                      selected={country.code === selectedCountry.code}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.28em] text-white/45">
                  <Globe className="h-3.5 w-3.5" />
                  All supported countries
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {OTHER_SOCIAL_COUNTRIES.map((country) => (
                    <CountryOption
                      key={country.code}
                      country={country}
                      selected={country.code === selectedCountry.code}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AuthHero({ mode }: { mode: AuthMode }) {
  const { selectedCountry } = useTheme();

  const copy = {
    login: {
      eyebrow: "Localized growth OS",
      title: `Welcome back, ${selectedCountry.name} creators`,
      description:
        "Bring your audience data, platform signals, and campaign instincts into one sharp operating system.",
    },
    signup: {
      eyebrow: "CreatorPulse onboarding",
      title: `Launch with a ${selectedCountry.name} flavor`,
      description:
        "Build a signup experience that feels local on day one, with a theme that shifts to the market you care about most.",
    },
    reset: {
      eyebrow: "Secure reset flow",
      title: `Recover access without losing your ${selectedCountry.name} momentum`,
      description:
        "Reset quickly, get back in, and keep your creator workspace tuned to the audience you serve.",
    },
  }[mode];

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-500 sm:p-8">
      <div
        className="absolute inset-0 opacity-90 transition-all duration-500"
        style={{
          background:
            "linear-gradient(145deg, rgba(var(--country-primary-rgb),0.18), rgba(8,16,31,0.08) 34%, rgba(var(--country-secondary-rgb),0.12) 68%, rgba(var(--country-accent-rgb),0.14))",
        }}
      />
      <div
        className="absolute -left-10 top-8 h-32 w-32 rounded-full blur-3xl transition-all duration-500"
        style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.22)" }}
      />
      <div
        className="absolute bottom-0 right-0 h-44 w-44 rounded-full blur-3xl transition-all duration-500"
        style={{ backgroundColor: "rgba(var(--country-secondary-rgb),0.18)" }}
      />

      <div className="relative">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-white/70">
          <WandSparkles className="h-3.5 w-3.5" />
          {copy.eyebrow}
        </div>

        <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-white/70 sm:text-base">
          {copy.description}
        </p>

        <div className="mt-8 grid gap-3">
          {SOCIAL_PROOF.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3"
            >
              <span
                className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.18)" }}
              >
                <Check className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-sm text-white/75">{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Primary</p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="h-8 w-8 rounded-full border border-white/10"
                style={{ backgroundColor: selectedCountry.primaryColor }}
              />
              <span className="text-sm text-white/80">{selectedCountry.primaryColor}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Secondary</p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="h-8 w-8 rounded-full border border-white/10"
                style={{ backgroundColor: selectedCountry.secondaryColor }}
              />
              <span className="text-sm text-white/80">{selectedCountry.secondaryColor}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Accent</p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="h-8 w-8 rounded-full border border-white/10"
                style={{ backgroundColor: selectedCountry.accentColor }}
              />
              <span className="text-sm text-white/80">{selectedCountry.accentColor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { selectedCountry } = useTheme();
  const supabaseConfigured = isSupabaseConfigured();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const pageCopy = useMemo(() => {
    if (mode === "signup") {
      return {
        title: "Create your account",
        subtitle: "A themed onboarding flow tuned to where your audience lives.",
        buttonLabel: "Create account",
        footer: (
          <p className="text-sm text-white/50">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium transition hover:opacity-80"
              style={{ color: "var(--country-secondary)" }}
            >
              Sign in
            </Link>
          </p>
        ),
      };
    }

    if (mode === "reset") {
      return {
        title: "Reset your password",
        subtitle: "We’ll send a secure reset link so you can get back into your workspace.",
        buttonLabel: "Send reset link",
        footer: (
          <p className="text-sm text-white/50">
            Remember it?{" "}
            <Link
              href="/login"
              className="font-medium transition hover:opacity-80"
              style={{ color: "var(--country-secondary)" }}
            >
              Sign in
            </Link>
          </p>
        ),
      };
    }

    return {
      title: "Sign in to CreatorPulse",
      subtitle: "One auth surface, many market moods. Pick a country and let the interface adapt.",
      buttonLabel: "Sign in",
      footer: (
        <p className="text-sm text-white/50">
          No account yet?{" "}
          <Link
            href="/signup"
            className="font-medium transition hover:opacity-80"
            style={{ color: "var(--country-secondary)" }}
          >
            Start free
          </Link>
        </p>
      ),
    };
  }, [mode]);

  function updateField(field: "fullName" | "email" | "password", value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleOAuth(provider: OAuthProvider) {
    if (!supabaseConfigured) return;

    setLoading(provider);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes:
          provider === "google"
            ? "https://www.googleapis.com/auth/youtube.readonly"
            : undefined,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseConfigured) return;

    setLoading("submit");
    setError(null);
    const supabase = createClient();

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(null);
        return;
      }

      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            country_code: selectedCountry.code,
            country_name: selectedCountry.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(null);
        return;
      }

      setSuccess(true);
      setLoading(null);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      formData.email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings/update-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(null);
      return;
    }

    setSuccess(true);
    setLoading(null);
  }

  if (success) {
    return (
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr]">
        <AuthHero mode={mode} />

        <div className="rounded-[32px] border border-white/10 bg-white/8 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.2)" }}
          >
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-white">
            {mode === "signup" ? "Check your email" : "Reset link sent"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/65">
            {mode === "signup"
              ? `We sent a confirmation link to ${formData.email}. Finish setup and your ${selectedCountry.name} theme will still be waiting for you.`
              : `We sent a password reset link to ${formData.email}. Open it to securely regain access.`}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-80"
            style={{ color: "var(--country-secondary)" }}
          >
            Return to sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-500"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(var(--country-primary-rgb),0.22), transparent 30%), radial-gradient(circle at 82% 18%, rgba(var(--country-secondary-rgb),0.18), transparent 28%), radial-gradient(circle at 50% 82%, rgba(var(--country-accent-rgb),0.14), transparent 34%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.15fr_0.85fr]">
        <AuthHero mode={mode} />

        <div className="rounded-[32px] border border-white/10 bg-white/8 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all duration-500 sm:p-7">
          <div className="rounded-[28px] border border-white/8 bg-[#06101e]/80 p-5 sm:p-6">
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/4 p-1">
              <Link
                href="/login"
                className={`rounded-xl px-4 py-2.5 text-center text-sm font-medium transition ${
                  mode === "login" ? "theme-button-primary" : "text-white/70"
                }`}
                style={
                  mode === "login"
                    ? undefined
                    : undefined
                }
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={`rounded-xl px-4 py-2.5 text-center text-sm font-medium transition ${
                  mode === "signup" ? "theme-button-primary" : "text-white/70"
                }`}
                style={
                  mode === "signup"
                    ? undefined
                    : undefined
                }
              >
                Sign up
              </Link>
            </div>

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/55">
                  {mode === "signup" ? <UserPlus className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {mode === "signup" ? "Sign up" : mode === "reset" ? "Recovery" : "Login"}
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-white">{pageCopy.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/60">{pageCopy.subtitle}</p>
              </div>

              <div
                className="hidden rounded-2xl border border-white/10 px-3 py-2 text-right sm:block"
                style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.1)" }}
              >
                <div className="text-xl">{selectedCountry.flag}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.24em] text-white/45">
                  {selectedCountry.code}
                </div>
              </div>
            </div>

            <CountrySelector />

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              {mode === "signup" ? (
                <input
                  type="text"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  required
                  className="theme-input w-full rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/35"
                />
              ) : null}

              <input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
                className="theme-input w-full rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/35"
              />

              {mode !== "reset" ? (
                <input
                  type="password"
                  placeholder={mode === "signup" ? "Password (min 8 characters)" : "Password"}
                  value={formData.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  minLength={mode === "signup" ? 8 : undefined}
                  required
                  className="theme-input w-full rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/35"
                />
              ) : null}

              {!supabaseConfigured ? (
                <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  {getSupabaseConfigError()}
                </div>
              ) : null}

              {error ? (
                <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </p>
              ) : null}

              {mode === "login" ? (
                <div className="flex items-center justify-between px-1 text-xs text-white/45">
                  <span className="inline-flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Theme follows {selectedCountry.name}
                  </span>
                  <Link
                    href="/reset-password"
                    className="transition hover:opacity-80"
                    style={{ color: "var(--country-secondary)" }}
                  >
                    Forgot password?
                  </Link>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading !== null || !supabaseConfigured}
                className="theme-button-primary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {pageCopy.buttonLabel}
              </button>
            </form>

            {mode === "login" ? (
              <Link
                href="/signup"
                className="mt-3 flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-medium text-white/82 transition hover:border-white/20 hover:bg-white/8"
              >
                New here? Create an account
              </Link>
            ) : null}

            {mode !== "reset" ? (
              <>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/8" />
                  <span className="text-xs uppercase tracking-[0.28em] text-white/35">or</span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>

                <div className="space-y-2.5">
                  {SOCIAL_PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => handleOAuth(provider.id)}
                      disabled={loading !== null || !supabaseConfigured}
                      className={`flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-50 ${provider.className}`}
                    >
                      {loading === provider.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-base">{provider.icon}</span>
                      )}
                      {provider.label}
                    </button>
                  ))}

                  {CUSTOM_PROVIDERS.map((provider) => (
                    <a
                      key={provider.id}
                      href={provider.href}
                      aria-disabled={!supabaseConfigured}
                      className={`flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all duration-500 ${
                        supabaseConfigured
                          ? "hover:bg-white/10"
                          : "pointer-events-none opacity-50"
                      }`}
                    >
                      <span className="text-base">{provider.icon}</span>
                      {provider.label}
                    </a>
                  ))}
                </div>
              </>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
              <p className="text-xs leading-5 text-white/35">
                By continuing you agree to our Terms and Privacy Policy.
              </p>
              {pageCopy.footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
