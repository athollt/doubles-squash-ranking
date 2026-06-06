import { render, screen } from "@testing-library/react";
import { Trend } from "./trend";

describe("Trend", () => {
  it("shows places climbed with an up marker", () => {
    render(<Trend movement={{ direction: "up", places: 2 }} />);
    expect(screen.getByText(/2/)).toHaveTextContent("▲2");
  });

  it("shows places dropped with a down marker", () => {
    render(<Trend movement={{ direction: "down", places: 1 }} />);
    expect(screen.getByText(/1/)).toHaveTextContent("▼1");
  });

  it("shows NEW for a new entry", () => {
    render(<Trend movement={{ direction: "new", places: 0 }} />);
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("shows a dash for no change", () => {
    render(<Trend movement={{ direction: "same", places: 0 }} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("uses different colour classes for up vs down", () => {
    const { rerender } = render(<Trend movement={{ direction: "up", places: 1 }} />);
    const up = screen.getByText("▲1").className;
    rerender(<Trend movement={{ direction: "down", places: 1 }} />);
    const down = screen.getByText("▼1").className;
    expect(up).not.toEqual(down);
  });
});
