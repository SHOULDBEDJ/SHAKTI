import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/AppContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { FieldSettingsProvider } from "@/lib/FieldSettingsContext";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import AppLayout from "@/components/AppLayout";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Expenses from "./pages/Expenses";
import Gallery from "./pages/Gallery";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound.tsx";
import { PermKey } from "./lib/AuthContext";

const queryClient = new QueryClient();

function Guard({ perm, children }: { perm: PermKey; children: JSX.Element }) {
  const { has } = useAuth();
  if (!has(perm)) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { has } = useAuth();
  const order: { perm: PermKey; path: string }[] = [
    { perm: "module.dashboard", path: "/dashboard" },
    { perm: "module.bookings", path: "/bookings" },
    { perm: "module.expenses", path: "/expenses" },
    { perm: "module.gallery", path: "/gallery" },
    { perm: "module.customers", path: "/customers" },
    { perm: "module.settings", path: "/settings" },
  ];
  const target = order.find((o) => has(o.perm));
  return <Navigate to={target?.path || "/profile"} replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<Guard perm="module.dashboard"><Dashboard /></Guard>} />
          <Route path="/bookings" element={<Guard perm="module.bookings"><Bookings /></Guard>} />
          <Route path="/expenses" element={<Guard perm="module.expenses"><Expenses /></Guard>} />
          <Route path="/gallery" element={<Guard perm="module.gallery"><Gallery /></Guard>} />
          <Route path="/customers" element={<Guard perm="module.customers"><Customers /></Guard>} />
          <Route path="/settings" element={<Guard perm="module.settings"><Settings /></Guard>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeProvider>
          <FieldSettingsProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {showSplash && <SplashScreen />}
                <AppRoutes />
              </TooltipProvider>
            </AuthProvider>
          </FieldSettingsProvider>
        </ThemeProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
