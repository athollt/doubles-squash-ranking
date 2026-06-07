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

// The single "Choose players" grid; chips are toggle buttons named by player.
function chip(name: string) {
  return within(screen.getByRole("group", { name: /choose players/i })).getByRole(
    "button",
    { name },
  );
}

describe("SessionForm single-grid select-then-score", () => {
  it("shows no score block until a player is selected", () => {
    render(
      <SessionForm players={PLAYERS} submitLabel="Log Results" onSubmit={noop} />,
    );
    expect(screen.queryByRole("button", { name: "0 wins" })).toBeNull();
    // The submit button is always available (validation is server-side).
    expect(
      screen.getByRole("button", { name: "Log Results" }),
    ).toBeInTheDocument();
  });

  it("reveals a score block for a player when selected, and removes it when unselected", () => {
    render(
      <SessionForm players={PLAYERS} submitLabel="Log Results" onSubmit={noop} />,
    );

    fireEvent.click(chip("Alice"));
    const block = screen.getByRole("group", { name: "Alice" });
    expect(within(block).getAllByRole("button", { name: "0 wins" }).length).toBe(1);

    // Tapping the chip again unselects and drops the block.
    fireEvent.click(chip("Alice"));
    expect(screen.queryByRole("group", { name: "Alice" })).toBeNull();
  });

  it("emits one FormSlot per selected player with its wins", () => {
    let captured: FormSlot[] | null = null;
    const onSubmit = (slots: FormSlot[]) => {
      captured = slots;
      return Promise.resolve({ ok: true as const });
    };
    render(
      <SessionForm players={PLAYERS} submitLabel="Log" onSubmit={onSubmit} />,
    );

    fireEvent.click(chip("Alice"));
    fireEvent.click(chip("Bob"));
    const alice = screen.getByRole("group", { name: "Alice" });
    fireEvent.click(within(alice).getByRole("button", { name: "3 wins" }));
    const bob = screen.getByRole("group", { name: "Bob" });
    fireEvent.click(within(bob).getByRole("button", { name: "1 wins" }));

    fireEvent.click(screen.getByRole("button", { name: "Log" }));

    expect(captured).toEqual([
      { playerId: "p1", newName: undefined, wins: 3 },
      { playerId: "p2", newName: undefined, wins: 1 },
    ]);
  });

  it("supports adding a brand-new player via + New", () => {
    let captured: FormSlot[] | null = null;
    const onSubmit = (slots: FormSlot[]) => {
      captured = slots;
      return Promise.resolve({ ok: true as const });
    };
    render(
      <SessionForm players={PLAYERS} submitLabel="Log" onSubmit={onSubmit} />,
    );

    fireEvent.click(chip("+ New"));
    // The new player's block carries a name input; fill it and set wins.
    const newBlock = screen.getByRole("group", { name: /new player 1/i });
    fireEvent.change(
      within(newBlock).getByRole("textbox", { name: /new player name/i }),
      { target: { value: "Carol" } },
    );
    fireEvent.click(within(newBlock).getByRole("button", { name: "2 wins" }));

    fireEvent.click(screen.getByRole("button", { name: "Log" }));
    expect(captured).toEqual([
      { playerId: undefined, newName: "Carol", wins: 2 },
    ]);
  });

  it("pre-selects players with their wins in edit mode (initialSlots)", () => {
    const initialSlots = [{ playerId: "p1", newName: "", wins: "3" }];
    render(
      <SessionForm
        players={PLAYERS}
        initialSlots={initialSlots}
        submitLabel="Save"
        onSubmit={noop}
      />,
    );
    const block = screen.getByRole("group", { name: "Alice" });
    expect(
      within(block).getByRole("button", { name: "3 wins" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(chip("Alice")).toHaveAttribute("aria-pressed", "true");
  });
});
