import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type PermKey =
  | "module.dashboard" | "module.bookings" | "module.expenses" | "module.gallery" | "module.customers" | "module.settings"
  | "bookings.create" | "bookings.edit" | "bookings.delete" | "bookings.whatsapp"
  | "expenses.create" | "expenses.edit" | "expenses.delete"
  | "gallery.create" | "gallery.upload" | "gallery.rename" | "gallery.delete"
  | "customers.edit" | "customers.delete"
  | "settings.manageUsers" | "settings.manageTypes" | "settings.theme" | "settings.fields" | "settings.calendar" | "settings.backup" | "settings.restore" | "settings.deleteAll";

export const ALL_PERMS: { key: PermKey; label: string; group: string }[] = [
  { key: "module.dashboard", label: "Dashboard", group: "Modules" },
  { key: "module.bookings", label: "Bookings", group: "Modules" },
  { key: "module.expenses", label: "Expenses", group: "Modules" },
  { key: "module.gallery", label: "Gallery", group: "Modules" },
  { key: "module.customers", label: "Customer History", group: "Modules" },
  { key: "module.settings", label: "Settings", group: "Modules" },

  { key: "bookings.create", label: "Create Booking", group: "Bookings" },
  { key: "bookings.edit", label: "Edit Booking", group: "Bookings" },
  { key: "bookings.delete", label: "Delete Booking", group: "Bookings" },
  { key: "bookings.whatsapp", label: "Send WhatsApp", group: "Bookings" },

  { key: "expenses.create", label: "Create Expense", group: "Expenses" },
  { key: "expenses.edit", label: "Edit Expense", group: "Expenses" },
  { key: "expenses.delete", label: "Delete Expense", group: "Expenses" },

  { key: "gallery.create", label: "Create Album", group: "Gallery" },
  { key: "gallery.upload", label: "Upload Media", group: "Gallery" },
  { key: "gallery.rename", label: "Rename Album", group: "Gallery" },
  { key: "gallery.delete", label: "Delete Album/Media", group: "Gallery" },

  { key: "customers.edit", label: "Edit Customer", group: "Customers" },
  { key: "customers.delete", label: "Delete Customer", group: "Customers" },

  { key: "settings.manageUsers", label: "Manage Users", group: "Settings" },
  { key: "settings.manageTypes", label: "Manage Function/Expense Types", group: "Settings" },
  { key: "settings.theme", label: "Change Theme", group: "Settings" },
  { key: "settings.fields", label: "Booking Form Fields", group: "Settings" },
  { key: "settings.calendar", label: "Calendar Settings", group: "Settings" },
  { key: "settings.backup", label: "Backup Data", group: "Settings" },
  { key: "settings.restore", label: "Restore Data", group: "Settings" },
  { key: "settings.deleteAll", label: "Delete All Data", group: "Settings" },
];

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  isAdmin: boolean;
  permissions: PermKey[];
}

const ADMIN: User = {
  id: "admin-master",
  username: "manna123",
  password: "rohit123",
  name: "Master Admin",
  isAdmin: true,
  permissions: ALL_PERMS.map((p) => p.key),
};

const USERS_KEY = "ssm-users";
const SESSION_KEY = "ssm-session";

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const list: User[] = raw ? JSON.parse(raw) : [];
    // Always ensure admin present
    if (!list.find((u) => u.username === ADMIN.username)) list.unshift(ADMIN);
    else {
      const idx = list.findIndex((u) => u.username === ADMIN.username);
      list[idx] = { ...list[idx], isAdmin: true, permissions: ADMIN.permissions };
    }
    return list;
  } catch {
    return [ADMIN];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

interface AuthCtx {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  has: (perm: PermKey) => boolean;
  addUser: (u: Omit<User, "id" | "isAdmin">) => { ok: boolean; error?: string };
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetOwn: (currentPassword: string, newUsername: string, newPassword: string) => { ok: boolean; error?: string };
  refresh: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const u = loadUsers();
    saveUsers(u);
    return u;
  });
  const [user, setUser] = useState<User | null>(() => {
    const sid = localStorage.getItem(SESSION_KEY);
    if (!sid) return null;
    return loadUsers().find((u) => u.id === sid) || null;
  });

  useEffect(() => {
    saveUsers(users);
    if (user) {
      const fresh = users.find((u) => u.id === user.id);
      if (fresh && fresh !== user) setUser(fresh);
      if (!fresh) {
        setUser(null);
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, [users]);

  const login: AuthCtx["login"] = (username, password) => {
    const found = users.find((u) => u.username === username.trim() && u.password === password);
    if (!found) return { ok: false, error: "Invalid username or password" };
    setUser(found);
    localStorage.setItem(SESSION_KEY, found.id);
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const has: AuthCtx["has"] = (perm) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return user.permissions.includes(perm);
  };

  const addUser: AuthCtx["addUser"] = (u) => {
    if (!u.username.trim() || !u.password) return { ok: false, error: "Username and password required" };
    if (users.find((x) => x.username.toLowerCase() === u.username.trim().toLowerCase()))
      return { ok: false, error: "Username already exists" };
    const newUser: User = { ...u, username: u.username.trim(), id: crypto.randomUUID(), isAdmin: false };
    setUsers((prev) => [...prev, newUser]);
    return { ok: true };
  };

  const updateUser: AuthCtx["updateUser"] = (id, patch) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        if (u.isAdmin) {
          // Admin: allow username/password/name changes only
          const { permissions, isAdmin, ...rest } = patch;
          return { ...u, ...rest };
        }
        return { ...u, ...patch };
      })
    );
  };

  const deleteUser: AuthCtx["deleteUser"] = (id) => {
    setUsers((prev) => prev.filter((u) => !(u.id === id && !u.isAdmin)));
  };

  const resetOwn: AuthCtx["resetOwn"] = (currentPassword, newUsername, newPassword) => {
    if (!user) return { ok: false, error: "Not logged in" };
    if (user.password !== currentPassword) return { ok: false, error: "Current password is incorrect" };
    const trimmed = newUsername.trim();
    if (!trimmed) return { ok: false, error: "Username required" };
    if (users.find((x) => x.id !== user.id && x.username.toLowerCase() === trimmed.toLowerCase()))
      return { ok: false, error: "Username already taken" };
    if (!newPassword) return { ok: false, error: "Password required" };
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, username: trimmed, password: newPassword } : u)));
    setUser({ ...user, username: trimmed, password: newPassword });
    return { ok: true };
  };

  const refresh = () => setUsers(loadUsers());

  return (
    <Ctx.Provider value={{ user, users, login, logout, has, addUser, updateUser, deleteUser, resetOwn, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
