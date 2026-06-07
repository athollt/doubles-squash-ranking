import { avatarInitial } from "./avatar";

describe("avatarInitial", () => {
  it("uses the first letter of the name, uppercased", () => {
    expect(avatarInitial({ name: "alice", email: "a@x.com" })).toBe("A");
  });

  it("falls back to the email when there is no name", () => {
    expect(avatarInitial({ name: null, email: "bob@x.com" })).toBe("B");
  });

  it("returns '?' when neither name nor email is usable", () => {
    expect(avatarInitial({ name: "", email: "" })).toBe("?");
  });
});
