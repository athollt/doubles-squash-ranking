"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createUserAction,
  updateUserRoleAction,
  updateUserNameAction,
  deleteUserAction,
} from "./actions";

type Role = "ADMIN" | "SCORER";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  created: string;
};

const ROLE_SELECT_CLASS =
  "h-9 rounded-md border border-input bg-transparent px-2 text-sm";

export function UsersClient({
  users,
  selfId,
  adminCount,
}: {
  users: UserRow[];
  selfId: string | null;
  adminCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState<Role>("SCORER");
  const [addError, setAddError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState<Role>("SCORER");
  const [editName, setEditName] = useState("");

  function handleAdd() {
    setAddError(null);
    startTransition(async () => {
      const result = await createUserAction(addEmail, addName, addRole);
      if (result.ok) {
        setAddEmail("");
        setAddName("");
        setAddRole("SCORER");
        setAddOpen(false);
      } else {
        setAddError(result.error);
      }
    });
  }

  function handleSaveEdit() {
    if (!editing) return;
    const nameChanged = editName.trim() !== editing.name;
    const roleChanged = editRole !== editing.role;
    if (!nameChanged && !roleChanged) {
      setEditing(null);
      return;
    }
    setRowError(null);
    startTransition(async () => {
      if (nameChanged) {
        const result = await updateUserNameAction(editing.id, editName);
        if (!result.ok) {
          setRowError(result.error);
          return;
        }
      }
      if (roleChanged) {
        const result = await updateUserRoleAction(editing.id, editRole);
        if (!result.ok) {
          setRowError(result.error);
          return;
        }
      }
      setEditing(null);
    });
  }

  function handleDelete(user: UserRow) {
    setRowError(null);
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      if (!result.ok) setRowError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>Add User</Button>
      </div>

      {rowError && <p className="text-destructive text-sm">{rowError}</p>}

      {/* Card per user (step 13.5 follow-up) — the 5-column table overflowed on a
          phone. Each row is a role="group" named by email so it stays addressable. */}
      {users.length === 0 ? (
        <p className="text-muted-foreground">No users yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((user) => {
            const isSelf = user.id === selfId;
            const isLastAdmin = user.role === "ADMIN" && adminCount <= 1;
            return (
              <li key={user.id}>
                <Card
                  role="group"
                  aria-label={user.email}
                  className="p-3 sm:flex sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{user.email}</p>
                    <p className="text-muted-foreground text-sm">
                      {user.name} · joined {user.created}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2 sm:mt-0">
                    <span className="text-muted-foreground mr-auto text-sm sm:mr-2">
                      {user.role}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => {
                        setEditing(user);
                        setEditRole(user.role);
                        setEditName(user.name);
                        setRowError(null);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending || isSelf || isLastAdmin}
                      title={
                        isSelf
                          ? "You cannot remove yourself."
                          : isLastAdmin
                            ? "Cannot remove the last admin."
                            : undefined
                      }
                      onClick={() => handleDelete(user)}
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Email"
            type="email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
          />
          <select
            className={ROLE_SELECT_CLASS}
            aria-label="Role"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value as Role)}
          >
            <option value="SCORER">SCORER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          {addError && <p className="text-destructive text-sm">{addError}</p>}
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isPending}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editing && (
            <p className="text-muted-foreground text-sm">{editing.email}</p>
          )}
          <Input
            placeholder="Name"
            aria-label="Name"
            value={editName}
            disabled={isPending}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
          <select
            className={ROLE_SELECT_CLASS}
            aria-label="Role"
            value={editRole}
            disabled={isPending}
            onChange={(e) => setEditRole(e.target.value as Role)}
          >
            <option value="SCORER">SCORER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          {rowError && <p className="text-destructive text-sm">{rowError}</p>}
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
