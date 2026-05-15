const palette = [
  "#8B5CF6",
  "#0EA5E9",
  "#F97316",
  "#22C55E",
  "#EC4899",
  "#EAB308",
  "#14B8A6",
  "#6366F1",
];

export function pickAvatarColor(seed: string) {
  const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length] ?? "#8B5CF6";
}
