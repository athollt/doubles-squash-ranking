"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  approveAccessRequestAction,
  dismissAccessRequestAction,
} from "./actions";

type Request = {
  id: string;
  email: string;
  name: string;
  // null = a request to set up a new league.
  league: string | null;
  notes: string | null;
  createdAt: string;
};

// The pending-request list. Approve creates the user + grant; Dismiss closes the
// request. Both refresh the list so the resolved row disappears.
export function AccessRequestsClient({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function review(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else setError(result.error ?? "Something went wrong.");
    });
  }

  if (requests.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No pending requests.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-destructive text-sm">{error}</p>}
      {requests.map((r) => (
        <Card key={r.id} className="flex flex-col gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{r.name}</p>
            <p className="text-muted-foreground truncate text-sm">{r.email}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {r.league ? (
                <>
                  Wants to score for{" "}
                  <span className="font-medium">{r.league}</span>
                </>
              ) : (
                <span className="font-medium">Wants to set up a new league</span>
              )}{" "}
              · {r.createdAt}
            </p>
            {r.notes && (
              <p className="mt-2 text-sm whitespace-pre-line">{r.notes}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              disabled={isPending}
              onClick={() => review(() => approveAccessRequestAction(r.id))}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => review(() => dismissAccessRequestAction(r.id))}
            >
              Dismiss
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
