import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserIcon, Save, LogOut, Camera, Store } from "lucide-react";
import { toast } from "sonner";
import { useDB } from "@/lib/useDB";
import { fileToDataUrl } from "@/lib/db";
import { Textarea } from "@/components/ui/textarea";

export default function Profile() {
  const { user, resetOwn, logout } = useAuth();
  const { data, update } = useDB();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [biz, setBiz] = useState(data?.business || { name: "", contact: "" });

  if (!user || !data) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const res = resetOwn(currentPassword, newUsername, newPassword);
    if (!res.ok) {
      toast.error(res.error || "Failed");
      return;
    }
    toast.success("Credentials updated");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const saveBiz = async (e: React.FormEvent) => {
    e.preventDefault();
    await update((d) => ({ ...d, business: biz }));
    toast.success("Business details updated");
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    setBiz((prev) => ({ ...prev, logo: url }));
  };

  return (
    <div className="space-y-4 max-w-xl pb-10">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <UserIcon className="h-6 w-6" /> Profile
      </h2>

      <Card className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{user.name || user.username}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Username</span>
          <span className="font-medium">{user.username}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Role</span>
          <span className="font-medium">{user.isAdmin ? "Master Admin" : "User"}</span>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Reset Credentials</h3>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>New Username</Label>
            <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="bg-gradient-primary">
            <Save className="h-4 w-4 mr-1" /> Save Changes
          </Button>
        </form>
      </Card>

      {user.isAdmin && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" /> Business Details
          </h3>
          <form onSubmit={saveBiz} className="space-y-3">
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center">
                {biz.logo ? (
                  <img src={biz.logo} className="w-full h-full object-cover" alt="Logo" />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground" />
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Upload Logo</p>
            </div>

            <div className="space-y-1">
              <Label>Business Name</Label>
              <Input value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Contact Number</Label>
                <Input value={biz.contact} onChange={(e) => setBiz({ ...biz, contact: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Alternate Contact</Label>
                <Input value={biz.altContact || ""} onChange={(e) => setBiz({ ...biz, altContact: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Business Address</Label>
              <Textarea value={biz.address || ""} onChange={(e) => setBiz({ ...biz, address: e.target.value })} />
            </div>
            <Button type="submit" className="bg-gradient-gold text-white font-bold w-full">
              <Save className="h-4 w-4 mr-1" /> Save Business Info
            </Button>
          </form>
        </Card>
      )}

      <Button variant="destructive" onClick={logout} className="w-full sm:w-auto">
        <LogOut className="h-4 w-4 mr-1" /> Log Out
      </Button>
    </div>
  );
}
