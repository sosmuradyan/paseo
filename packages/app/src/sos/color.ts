// SOS: blend two hex colors; `amount` 0 keeps `base`, 1 gives `over`. Falls back to `over`
// when either side is not a hex color.
export function mixHex(base: string, over: string, amount: number): string {
  const parse = (hex: string) => {
    const value = hex.replace("#", "");
    const full =
      value.length === 3
        ? value
            .split("")
            .map((c) => c + c)
            .join("")
        : value.slice(0, 6);
    return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
  };
  const a = parse(base);
  const b = parse(over);
  if (a.some(Number.isNaN) || b.some(Number.isNaN)) return over;
  return `#${a
    .map((channel, i) => Math.round(channel + (b[i] - channel) * amount))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}
