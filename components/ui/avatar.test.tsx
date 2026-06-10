import { render, screen, fireEvent } from "@testing-library/react";
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

  it("falls back to the initial when the image fails to load", () => {
    // A broken/expired Google avatar URL must not leave a broken-image icon —
    // on error the avatar shows the initial instead.
    render(<Avatar name="Alice" email="a@x.com" image="https://x/broken.png" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
