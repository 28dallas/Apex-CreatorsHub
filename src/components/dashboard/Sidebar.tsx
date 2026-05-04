"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  BarChart3,
  Zap,
  CreditCard,
  LogOut,
  Settings,
  CalendarDays,
  PenLine,
  Flame,
  FileText,
  Users,
  Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Content Calendar", icon: CalendarDays },
  { href: "/captions", label: "Caption Generator", icon: PenLine },
  { href: "/hooks", label: "Hook Library", icon: Flame },
  { href: "/scripts", label: "Script Writer", icon: FileText },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/heatmap", label: "Post Heatmap", icon: BarChart3 },
  { href: "/competitors", label: "Competitors", icon: Users },
  { href: "/boost", label: "SMM Booster", icon: Zap },
  { href: "/media-kit", label: "Media Kit", icon: Briefcase },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: {
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    tier?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className="hidden w-64 flex-col border-r p-4 md:flex"
      style={{
        background:
          "linear-gradient(180deg, rgba(var(--country-primary-rgb),0.14), rgba(8,15,28,0.96) 16%, rgba(8,15,28,0.98) 100%)",
        borderColor: "rgba(var(--country-secondary-rgb),0.18)",
      }}
    >
      {/* Logo */}
      <div className="mb-8 px-2">
        <span
          className="text-lg font-bold bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--country-secondary), var(--country-primary), var(--country-accent))",
          }}
        >
          CreatorPulse
        </span>
        <div className="mt-1">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={
              user.tier === "agency"
                ? {
                    backgroundColor: "rgba(var(--country-accent-rgb),0.18)",
                    color: "var(--country-accent)",
                  }
                : user.tier === "growth"
                ? {
                    backgroundColor: "rgba(var(--country-primary-rgb),0.18)",
                    color: "var(--country-primary)",
                  }
                : {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.6)",
                  }
            }
          >
            {user.tier === "agency" ? "Agency" : user.tier === "growth" ? "Growth" : "Starter"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              style={
                active
                  ? {
                      backgroundColor: "rgba(var(--country-primary-rgb),0.18)",
                      boxShadow: "inset 0 0 0 1px rgba(var(--country-secondary-rgb),0.18)",
                    }
                  : undefined
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div
        className="space-y-1 border-t pt-4"
        style={{ borderColor: "rgba(var(--country-secondary-rgb),0.14)" }}
      >
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
        <div className="px-3 py-2">
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
    </aside>
  );
}
