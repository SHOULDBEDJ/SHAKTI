import { useState } from "react";
import { useAuth, ALL_PERMS, PermKey, User } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { UserPlus, Pencil, Trash2, Shield, Save } from "lucide-react";
import { toast } from "sonner";

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useAuth();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" /> User Management
        </h3>
        <Button size="sm" onClick={() => setCreating(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Add User
        </Button>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between border rounded-md p-3">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {u.username}{" "}
                {u.isAdmin && (
                  <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded ml-1">Admin</span>
                )}
              </p>
              {u.name && <p className="text-xs text-muted-foreground truncate">{u.name}</p>}
              {!u.isAdmin && (
                <p className="text-xs text-muted-foreground">{u.permissions.length} permissions</p>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditing(u)}>
                <Pencil className="h-4 w-4" />
              </Button>
              {!u.isAdmin && (
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(u.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
          <UserForm
            onSave={(payload) => {
              const r = addUser(payload);
              if (!r.ok) { toast.error(r.error || "Failed"); return false; }
              toast.success("User added");
              setCreating(false);
              return true;
            }}
            onCancel={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editing && (
            <UserForm
              initial={editing}
              onSave={(payload) => {
                updateUser(editing.id, payload);
                toast.success("User updated");
                setEditing(null);
                return true;
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteUser(deleteId);
                  toast.success("User deleted");
                }
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function UserForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: User;
  onSave: (payload: any) => boolean;
  onCancel: () => void;
}) {
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState(initial?.password || "");
  const [name, setName] = useState(initial?.name || "");
  const [perms, setPerms] = useState<PermKey[]>(initial?.permissions || []);

  const isAdmin = !!initial?.isAdmin;

  const toggle = (k: PermKey, v: boolean) => {
    setPerms((p) => (v ? [...new Set([...p, k])] : p.filter((x) => x !== k)));
  };

  const groups = Array.from(new Set(ALL_PERMS.map((p) => p.group)));

  const submit = () => {
    onSave({
      username,
      password,
      name,
      permissions: isAdmin ? initial!.permissions : perms,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Username (Login ID)</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Password</Label>
          <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Display Name (Optional)</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      {isAdmin ? (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          Master admin always has full access. Permissions cannot be modified.
        </div>
      ) : (
        <div className="space-y-3">
          <Label className="text-base">Permissions</Label>
          {groups.map((g) => (
            <div key={g}>
              <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">{g}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {ALL_PERMS.filter((p) => p.group === g).map((p) => (
                  <label
                    key={p.key}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={perms.includes(p.key)}
                      onCheckedChange={(v) => toggle(p.key, !!v)}
                    />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit} className="bg-gradient-primary">
          <Save className="h-4 w-4 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}
