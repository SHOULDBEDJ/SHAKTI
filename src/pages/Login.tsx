import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, LogIn } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = login(username, password);
    if (!res.ok) setError(res.error || "Login failed");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="rounded-full p-1 bg-gradient-primary shadow-elegant">
            <img src={logo} alt="Shiva Shakti Shamiyana" className="w-24 h-24 rounded-full object-cover ring-4 ring-background" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Shiva Shakti Shamiyana
          </h1>
          <p className="text-sm text-muted-foreground">Business Management System</p>
        </div>

        <Card className="p-6 shadow-elegant border-border/50 backdrop-blur">
          <form onSubmit={submit} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Sign In</h2>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label="Toggle password"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
              <LogIn className="h-4 w-4 mr-2" /> Sign In
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Shiva Shakti Shamiyana
        </p>
      </div>
    </div>
  );
}
