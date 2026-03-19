import { formatChange, formatCurrency } from "@/lib/format";

describe("format helpers", () => {
  it("formats currencies", () => {
    expect(formatCurrency(12.5)).toBe("$12.50");
  });

  it("formats positive changes", () => {
    expect(formatChange(1.25)).toBe("+1.25%");
  });
});
