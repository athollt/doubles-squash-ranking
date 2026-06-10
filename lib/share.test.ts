import { buildShareText, ladderUrlForSlug } from "./share";

describe("ladderUrlForSlug", () => {
  it("builds the absolute /l/{slug} URL from AUTH_URL", () => {
    const prev = process.env.AUTH_URL;
    process.env.AUTH_URL = "https://rungs.example";
    expect(ladderUrlForSlug("bsc-doubles-squash")).toBe(
      "https://rungs.example/l/bsc-doubles-squash",
    );
    process.env.AUTH_URL = prev;
  });

  it("tolerates a trailing slash on the base URL", () => {
    const prev = process.env.AUTH_URL;
    process.env.AUTH_URL = "https://rungs.example/";
    expect(ladderUrlForSlug("padel")).toBe("https://rungs.example/l/padel");
    process.env.AUTH_URL = prev;
  });
});

describe("buildShareText", () => {
  const roster = [
    { name: "Alice", wins: 3 },
    { name: "Bob", wins: 2 },
    { name: "Carol", wins: 2 },
    { name: "Dave", wins: 1 },
  ];

  it("is just the scores line and the ladder link when there are no notes", () => {
    const text = buildShareText({
      roster,
      ladderUrl: "https://squash.example/",
    });
    expect(text).toBe(
      "Scores: Alice 3, Bob 2, Carol 2, Dave 1\n" +
        "Ladder: https://squash.example/",
    );
  });

  it("preserves the given roster order", () => {
    const text = buildShareText({
      roster: [
        { name: "Zara", wins: 1 },
        { name: "Amy", wins: 5 },
      ],
      ladderUrl: "https://x/",
    });
    expect(text).toContain("Scores: Zara 1, Amy 5");
  });

  it("puts the notes on the first line, above the scores", () => {
    const text = buildShareText({
      roster,
      ladderUrl: "https://squash.example/",
      notes: "Great squash today guys",
    });
    expect(text).toBe(
      "Great squash today guys\n" +
        "Scores: Alice 3, Bob 2, Carol 2, Dave 1\n" +
        "Ladder: https://squash.example/",
    );
  });

  it("omits the notes line entirely when notes are absent or blank", () => {
    const expected =
      "Scores: Alice 3, Bob 2, Carol 2, Dave 1\n" +
      "Ladder: https://squash.example/";
    const base = { roster, ladderUrl: "https://squash.example/" };
    expect(buildShareText(base)).toBe(expected);
    expect(buildShareText({ ...base, notes: "" })).toBe(expected);
    expect(buildShareText({ ...base, notes: "   " })).toBe(expected);
  });
});
