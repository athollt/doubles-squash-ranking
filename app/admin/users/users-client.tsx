"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  function handleRoleChange(user: UserRow, role: Role) {
    if (role === user.role) return;
    setRowError(null);
    startTransition(async () => {
      const result = await updateUserRoleAction(user.id, role);
      if (!result.ok) setRowError(result.error);
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                No users yet.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const isSelf = user.id === selfId;
              const isLastAdmin = user.role === "ADMIN" && adminCount <= 1;
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <select
                      className={ROLE_SELECT_CLASS}
                      aria-label={`Role for ${user.email}`}
                      value={user.role}
                      disabled={isPending}
                      onChange={(e) =>
                        handleRoleChange(user, e.target.value as Role)
                      }
                    >
                      <option value="SCORER">SCORER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </TableCell>
                  <TableCell>{user.created}</TableCell>
                  <TableCell className="flex justify-end gap-2">
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
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

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
    </div>
  );
}
