"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_COUNTRY,
  TOP_SOCIAL_COUNTRIES,
  type CountryTheme,
} from "@/data/countries";

type AuthThemeContextValue = {
  selectedCountry: CountryTheme;
  setSelectedCountryCode: (code: string) => void;
  themeStyle: Record<string, string>;
  buttonTextColor: string;
};

const STORAGE_KEY = "creatorpulse-country-theme";

const AuthThemeContext = createContext<AuthThemeContextValue | null>(null);

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
}

function getContrastColor(hex: string) {
  const normalized = hex.replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? "#0F172A" : "#FFFFFF";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);

  useEffect(() => {
    const storedCountryCode = window.localStorage.getItem(STORAGE_KEY);
    if (!storedCountryCode) return;

    const match = TOP_SOCIAL_COUNTRIES.find(
      (country) => country.code === storedCountryCode
    );

    if (match) {
      setSelectedCountry(match);
    }
  }, []);

  const value = useMemo(() => {
    const buttonTextColor = getContrastColor(selectedCountry.primaryColor);
    const themeStyle = {
      "--page-background": "#050816",
      "--country-primary": selectedCountry.primaryColor,
      "--country-primary-rgb": hexToRgb(selectedCountry.primaryColor),
      "--country-secondary": selectedCountry.secondaryColor,
      "--country-secondary-rgb": hexToRgb(selectedCountry.secondaryColor),
      "--country-accent": selectedCountry.accentColor,
      "--country-accent-rgb": hexToRgb(selectedCountry.accentColor),
      "--country-button-foreground": buttonTextColor,
    } as Record<string, string>;

    return {
      selectedCountry,
      setSelectedCountryCode: (code: string) => {
        const nextCountry =
          TOP_SOCIAL_COUNTRIES.find((country) => country.code === code) ??
          DEFAULT_COUNTRY;

        setSelectedCountry(nextCountry);
        window.localStorage.setItem(STORAGE_KEY, nextCountry.code);
      },
      themeStyle,
      buttonTextColor,
    };
  }, [selectedCountry]);

  return (
    <AuthThemeContext.Provider value={value}>
      <div
        style={value.themeStyle}
        className="min-h-screen text-white transition-[background,color,border-color,box-shadow] duration-500"
      >
        <div
          className="min-h-screen transition-all duration-500"
          style={{
            backgroundColor: "var(--page-background)",
            backgroundImage:
              "radial-gradient(circle at 12% 18%, rgba(var(--country-primary-rgb),0.22), transparent 28%), radial-gradient(circle at 84% 12%, rgba(var(--country-secondary-rgb),0.16), transparent 24%), radial-gradient(circle at 56% 84%, rgba(var(--country-accent-rgb),0.14), transparent 30%), linear-gradient(160deg, #020617 0%, #08101f 48%, #020617 100%)",
          }}
        >
          {children}
        </div>
      </div>
    </AuthThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(AuthThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
