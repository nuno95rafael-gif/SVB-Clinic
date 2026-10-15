"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart3,
  Wallet,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { UserProfile, UserRole } from "@/types/database";
import { signOut } from "@/app/(app)/actions";
import { ClinicSwitcher } from "./clinic-switcher";
import { ThemeToggle } from "./theme-toggle";

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
  { href: "/clinicas", label: "Clínicas", icon: Building2, roles: ["admin"] },
  { href: "/definicoes", label: "Definições", icon: Settings, roles: ["admin", "professional"] },
] as const;

export function Sidebar({
  profile,
  clinics = [],
  activeClinicId = null,
}: {
  profile: UserProfile;
  clinics?: { id: string; name: string }[];
  activeClinicId?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // fecha a gaveta ao navegar (no telemóvel o menu fica por cima do conteúdo)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="rounded-md p-1.5 text-foreground-soft hover:bg-background"
        >
          <Menu size={20} />
        </button>
        <Image src="/logo-svb-icon.png" alt="SVB" width={26} height={26} className="h-[26px] w-[26px]" />
        <span className="font-semibold">SVB Clinic</span>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-line bg-surface transition-transform md:static md:z-auto md:w-60 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Fechar menu"
        className="absolute right-3 top-4 rounded-md p-1.5 text-foreground-faint hover:bg-background md:hidden"
      >
        <X size={18} />
      </button>
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

      <ClinicSwitcher clinics={clinics} activeClinicId={activeClinicId} />

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.filter((item) => item.roles.includes(profile.role)).map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 md:py-2 text-[13.5px] font-medium transition-colors",
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
          <ThemeToggle />
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
    </>
  );
}
