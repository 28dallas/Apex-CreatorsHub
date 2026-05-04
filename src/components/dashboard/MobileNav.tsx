"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  BarChart3,
  Zap,
  CalendarDays,
  PenLine,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/captions", label: "Captions", icon: PenLine },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/ai-assistant", label: "AI", icon: Sparkles },
];

interface MobileNavProps {
  user: {
    email: string;
    full_name?: string | null;
    tier?: string | null;
  };
}

export default function MobileNav({ user: _ }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar — mobile only */}
      <header
        className="flex items-center justify-between border-b px-4 py-3 md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(var(--country-primary-rgb),0.12), rgba(8,15,28,0.96))",
          borderColor: "rgba(var(--country-secondary-rgb),0.16)",
        }}
      >
        <span
          className="font-bold bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--country-secondary), var(--country-primary), var(--country-accent))",
          }}
        >
          CreatorPulse
        </span>
      </header>

      {/* Bottom tab bar — mobile only */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
        style={{
          backgroundColor: "rgba(8,15,28,0.96)",
          borderTop: "1px solid rgba(var(--country-secondary-rgb),0.16)",
          backdropFilter: "blur(16px)",
        }}
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                active ? "text-white" : "text-slate-500"
              }`}
              style={
                active
                  ? {
                      backgroundColor: "rgba(var(--country-primary-rgb),0.12)",
                      color: "var(--country-secondary)",
                    }
                  : undefined
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
