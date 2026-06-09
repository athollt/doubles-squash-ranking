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

export function PlayersClient({
  players,
  slug,
}: {
  players: PlayerRow[];
  slug: string;
}) {
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
      const result = await createPlayerAction(slug, addName);
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
      const result = await updatePlayerNameAction(slug, editing.id, editName);
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
      await updatePlayerStatusAction(slug, player.id, next);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>Add Player</Button>
      </div>

      {/* Card per player (step 16.1) — same layout as Admin → Users: a
          role="group" named by the player so it stays addressable, with the
          actions right-aligned. */}
      {players.length === 0 ? (
        <p className="text-muted-foreground">No players yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {players.map((player) => (
            <li key={player.id}>
              <Card
                role="group"
                aria-label={player.name}
                className="p-3 sm:flex sm:items-center sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{player.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {player.status} · added {player.created}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2 sm:mt-0">
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
                    {player.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

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
