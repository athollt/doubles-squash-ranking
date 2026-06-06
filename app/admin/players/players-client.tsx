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
  createPlayerAction,
  updatePlayerNameAction,
  updatePlayerStatusAction,
} from "./actions";

type PlayerRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "REMOVED";
  created: string;
};

export function PlayersClient({ players }: { players: PlayerRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PlayerRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  function handleAdd() {
    setAddError(null);
    startTransition(async () => {
      const result = await createPlayerAction(addName);
      if (result.ok) {
        setAddName("");
        setAddOpen(false);
      } else {
        setAddError(result.error);
      }
    });
  }

  function handleRename() {
    if (!editing) return;
    setEditError(null);
    startTransition(async () => {
      const result = await updatePlayerNameAction(editing.id, editName);
      if (result.ok) {
        setEditing(null);
      } else {
        setEditError(result.error);
      }
    });
  }

  function handleToggleStatus(player: PlayerRow) {
    const next = player.status === "ACTIVE" ? "REMOVED" : "ACTIVE";
    startTransition(async () => {
      await updatePlayerStatusAction(player.id, next);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>Add Player</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-center">
                No players yet.
              </TableCell>
            </TableRow>
          ) : (
            players.map((player) => (
              <TableRow key={player.id}>
                <TableCell>{player.name}</TableCell>
                <TableCell>{player.status}</TableCell>
                <TableCell>{player.created}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      setEditing(player);
                      setEditName(player.name);
                      setEditError(null);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={player.status === "ACTIVE" ? "destructive" : "secondary"}
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggleStatus(player)}
                  >
                    {player.status === "ACTIVE" ? "Remove" : "Reactivate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Player name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            autoFocus
          />
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
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
          {editError && <p className="text-destructive text-sm">{editError}</p>}
          <DialogFooter>
            <Button onClick={handleRename} disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
