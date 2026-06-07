import { buildShareText } from "./share";

describe("buildShareText", () => {
  const roster = [
    { name: "Alice", wins: 3 },
    { name: "Bob", wins: 2 },
    { name: "Carol", wins: 2 },
    { name: "Dave", wins: 1 },
  ];

  it("lists each player with their wins, the date, and the ladder link", () => {
    const text = buildShareText({
      roster,
      date: new Date("2026-06-07T18:30:00Z"),
      ladderUrl: "https://squash.example/",
    });
    expect(text).toBe(
      "Doubles @ BSC — 7 Jun\n\n" +
        "Alice 3, Bob 2, Carol 2, Dave 1\n\n" +
        "Ladder: https://squash.example/",
    );
  });

  it("preserves the given roster order", () => {
    const text = buildShareText({
      roster: [
        { name: "Zara", wins: 1 },
        { name: "Amy", wins: 5 },
      ],
      date: new Date("2026-01-02T08:00:00Z"),
      ladderUrl: "https://x/",
    });
    expect(text).toContain("Zara 1, Amy 5");
    expect(text).toContain("2 Jan");
  });
});
