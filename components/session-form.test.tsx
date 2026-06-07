import { render, screen, fireEvent, within } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { SessionForm, type FormSlot } from "./session-form";

const PLAYERS = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
];

function noop() {
  return Promise.resolve({ ok: true as const });
}

describe("SessionForm two-phase flow", () => {
  it("picks players first, then reveals score entry on continue", () => {
    render(
      <SessionForm players={PLAYERS} submitLabel="Log Results" onSubmit={noop} />,
    );

    // Phase 1 (pick): no wins selectors yet, and the submit button isn't shown.
    expect(screen.queryByRole("button", { name: "0 wins" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Log Results" })).toBeNull();

    // Choose a player in slot 1.
    const slot1 = screen.getByRole("group", { name: "Player 1" });
    fireEvent.click(within(slot1).getByRole("button", { name: "Alice" }));

    // Advance to scoring.
    fireEvent.click(screen.getByRole("button", { name: /continue to scores/i }));

    // Phase 2 (score): wins selectors and the submit button are now present.
    expect(screen.getAllByRole("button", { name: "0 wins" }).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Log Results" }),
    ).toBeInTheDocument();
  });

  it("starts in the score phase when initial slots are provided (edit mode)", () => {
    const initialSlots = [{ playerId: "p1", newName: "", wins: "3" }];
    render(
      <SessionForm
        players={PLAYERS}
        initialSlots={initialSlots}
        submitLabel="Save"
        onSubmit={noop}
      />,
    );

    // Edit mode lands directly on scoring — the wins selector is immediately usable.
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "0 wins" }).length).toBeGreaterThan(0);
  });

  it("emits the same FormSlot payload as before", () => {
    let captured: FormSlot[] | null = null;
    const onSubmit = (slots: FormSlot[]) => {
      captured = slots;
      return Promise.resolve({ ok: true as const });
    };
    const initialSlots = [{ playerId: "p1", newName: "", wins: "0" }];
    render(
      <SessionForm
        players={PLAYERS}
        initialSlots={initialSlots}
        submitLabel="Save"
        onSubmit={onSubmit}
      />,
    );

    const slot1 = screen.getByRole("group", { name: "Player 1" });
    fireEvent.click(within(slot1).getByRole("button", { name: "4 wins" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(captured).toEqual([{ playerId: "p1", newName: undefined, wins: 4 }]);
  });
});
