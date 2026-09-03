"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  BarChart3,
  Wallet,
  DoorOpen,
  UserCog,
  Settings,
  LogOut,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { UserProfile, UserRole } from "@/types/database";
import { signOut } from "@/app/(app)/actions";

const NAV: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "professional"] },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, roles: ["admin", "professional"] },
  { href: "/pacientes", label: "Pacientes", icon: Users, roles: ["admin", "professional"] },
  { href: "/estatisticas", label: "Estatísticas", icon: BarChart3, roles: ["admin"] },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, roles: ["admin"] },
  { href: "/espacos", label: "Espaços", icon: DoorOpen, roles: ["admin"] },
  { href: "/profissionais", label: "Profissionais", icon: Stethoscope, roles: ["admin"] },
  { href: "/utilizadores", label: "Utilizadores", icon: UserCog, roles: ["admin"] },
  { href: "/definicoes", label: "Definições", icon: Settings, roles: ["admin", "professional"] },
] as const;

export function Sidebar({ profile }: { profile: UserProfile }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Image
          src="/logo-svb-icon.png"
          alt="SVB"
          width={32}
          height={32}
          className="h-8 w-8 shrink-0"
          priority
        />
        <span className="font-semibold">SVB Clinic</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.filter((item) => item.roles.includes(profile.role)).map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent-ink"
                  : "text-foreground-soft hover:bg-background hover:text-foreground"
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink">
            {initials(profile.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{profile.full_name}</p>
            <p className="truncate text-[11px] text-foreground-faint">
              {profile.role === "admin" ? "Administrador" : "Profissional"}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sair"
              className="rounded-md p-1.5 text-foreground-faint hover:bg-rose-soft hover:text-rose"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
