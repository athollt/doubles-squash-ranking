import { render, screen } from "@testing-library/react";
import { Avatar } from "./avatar";

describe("Avatar", () => {
  it("renders the profile image when one is given", () => {
    render(<Avatar name="Alice" email="a@x.com" image="https://x/p.png" />);
    const img = screen.getByRole("img", { name: /alice/i });
    expect(img).toHaveAttribute("src", "https://x/p.png");
  });

  it("falls back to the initial when there is no image", () => {
    render(<Avatar name="Alice" email="a@x.com" image={null} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
