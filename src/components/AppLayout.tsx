import { Menu, X, LayoutDashboard, CalendarCheck, Wallet, Images, Users, Settings as SettingsIcon, User as UserIcon, LogOut } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { useAuth, PermKey } from "@/lib/AuthContext";
import logo from "@/assets/logo.jpeg";
import { useDB } from "@/lib/useDB";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useApp();
  const { user, logout, has } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data } = useDB();

  const allItems: { to: string; label: string; icon: any; perm: PermKey }[] = [
    { to: "/dashboard", label: t("dashboard"), icon: LayoutDashboard, perm: "module.dashboard" },
    { to: "/bookings", label: t("bookings"), icon: CalendarCheck, perm: "module.bookings" },
    { to: "/expenses", label: t("expenses"), icon: Wallet, perm: "module.expenses" },
    { to: "/gallery", label: t("gallery"), icon: Images, perm: "module.gallery" },
    { to: "/customers", label: t("customerHistory"), icon: Users, perm: "module.customers" },
    { to: "/settings", label: t("settings"), icon: SettingsIcon, perm: "module.settings" },
  ];
  const items = allItems.filter((i) => has(i.perm));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-primary text-primary-foreground shadow-elegant">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen((o) => !o)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              aria-label="Menu"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <img src={data?.business.logo || logo} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-accent/60" />
            <h1 className="text-base sm:text-lg font-bold truncate">{data?.business.name || t("appName")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-primary-foreground/10 rounded-full p-1 text-xs">
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "px-3 py-1 rounded-full transition",
                  lang === "en" ? "bg-accent text-accent-foreground font-semibold" : "text-primary-foreground/80"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLang("kn")}
                className={cn(
                  "px-3 py-1 rounded-full transition",
                  lang === "kn" ? "bg-accent text-accent-foreground font-semibold" : "text-primary-foreground/80"
                )}
              >
                ಕನ್ನಡ
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              aria-label="Profile"
              title={user?.username}
            >
              <UserIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "fixed top-[60px] left-0 z-30 h-[calc(100vh-60px)] w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 shadow-elegant flex flex-col",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                      : "hover:bg-sidebar-accent"
                  )
                }
              >
                <it.icon className="h-5 w-5" />
                <span>{it.label}</span>
              </NavLink>
            ))}
            <NavLink
              to="/profile"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                    : "hover:bg-sidebar-accent"
                )
              }
            >
              <UserIcon className="h-5 w-5" />
              <span>Profile</span>
            </NavLink>
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/70 mb-2 px-1 truncate">
              {user?.username} {user?.isAdmin && "(Admin)"}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { logout(); setOpen(false); }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Log Out
            </Button>
          </div>
        </aside>

        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[60px] z-20 bg-black/40 backdrop-blur-sm"
          />
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
