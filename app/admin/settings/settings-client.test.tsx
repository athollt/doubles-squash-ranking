import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("./actions", () => ({
  saveAndRecalculateAction: vi.fn(() => Promise.resolve({ ok: true })),
}));

import { SettingsClient } from "./settings-client";

const SETTINGS = [{ key: "KFactor", value: 160, description: "Sensitivity" }];

describe("SettingsClient", () => {
  it("is read-only by default — values shown, no inputs, no Save", () => {
    render(<SettingsClient settings={SETTINGS} canEdit />);
    expect(screen.getByText("160")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "KFactor" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /save & recalculate/i }),
    ).toBeNull();
  });

  it("shows an Edit button only when the user may edit (admin)", () => {
    const { rerender } = render(<SettingsClient settings={SETTINGS} canEdit />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();

    rerender(<SettingsClient settings={SETTINGS} canEdit={false} />);
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("reveals editable inputs and Save after clicking Edit", () => {
    render(<SettingsClient settings={SETTINGS} canEdit />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(
      screen.getByRole("spinbutton", { name: "KFactor" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save & recalculate/i }),
    ).toBeInTheDocument();
  });
});
