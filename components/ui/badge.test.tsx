import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies a distinct class per variant", () => {
    const { rerender } = render(<Badge variant="new">New</Badge>);
    const newClass = screen.getByText("New").className;

    rerender(<Badge variant="muted">Resting</Badge>);
    const mutedClass = screen.getByText("Resting").className;

    expect(newClass).not.toEqual(mutedClass);
  });
});
