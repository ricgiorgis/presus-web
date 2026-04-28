"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  CreditCard,
  HandCoins,
  Users,
  Car,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/services/supabase/auth";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/gastos", icon: Receipt, labelKey: "nav.gastos" },
  { href: "/presupuesto", icon: PieChart, labelKey: "nav.presupuesto" },
  { href: "/metas", icon: Target, labelKey: "nav.metas" },
  { href: "/cuotas", icon: CreditCard, labelKey: "nav.cuotas" },
  { href: "/deudas", icon: HandCoins, labelKey: "nav.deudas" },
  { href: "/familia", icon: Users, labelKey: "nav.familia" },
  { href: "/vehiculo", icon: Car, labelKey: "nav.vehiculo" },
];

function NavLink({ href, icon: Icon, label, active, onClick }: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "text-white"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      style={active ? { backgroundColor: "#2E7D32" } : undefined}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

function SidebarContent({ pathname, onLinkClick, user, onLogout }: {
  pathname: string;
  onLinkClick?: () => void;
  user: User | null;
  onLogout: () => void;
}) {
  const { t } = useTranslation();
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const initials = fullName
    ? fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#2E7D32" }}>
          P
        </div>
        <span className="text-lg font-bold">Presus</span>
      </div>
      <Separator />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon, labelKey }) => (
          <NavLink
            key={href}
            href={href}
            icon={icon}
            label={t(labelKey)}
            active={pathname === href}
            onClick={onLinkClick}
          />
        ))}
      </nav>

      <Separator />

      {/* Config + User */}
      <div className="px-3 py-3 space-y-1">
        <NavLink
          href="/config"
          icon={Settings}
          label={t("nav.config")}
          active={pathname === "/config"}
          onClick={onLinkClick}
        />
        <div className="flex items-center gap-3 px-3 py-2 mt-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs text-white" style={{ backgroundColor: "#1565C0" }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fullName ?? "Usuario"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onLogout}
            title={t("auth.logout")}
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getUser().then((u) => {
      setUser(u);
      setLoading(false);
      if (!u) router.replace("/login");
    }).catch(() => {
      setLoading(false);
      router.replace("/login");
    });
  }, [router]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.replace("/login");
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[250px] shrink-0 border-r bg-card">
        <SidebarContent pathname={pathname} user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-card">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9" />}>
              <Menu size={20} />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[250px]">
              <SidebarContent
                pathname={pathname}
                onLinkClick={() => setSheetOpen(false)}
                user={user}
                onLogout={handleLogout}
              />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#2E7D32" }}>
              P
            </div>
            <span className="font-bold">Presus</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
