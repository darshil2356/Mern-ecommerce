const HEX_TO_NAME = {
  "#000000": "Black",
  "#ffffff": "White",
  "#ff0000": "Red",
  "#00ff00": "Green",
  "#008000": "Green",
  "#0000ff": "Blue",
  "#ffff00": "Yellow",
  "#ffa500": "Orange",
  "#ffc0cb": "Pink",
  "#800080": "Purple",
  "#a52a2a": "Brown",
  "#808080": "Gray",
  "#808080ff": "Gray",
  "#c0c0c0": "Silver",
  "#d4af37": "Gold",
  "#8b5cf6": "Violet",
  "#4b5563": "Slate",
  "#f5f5dc": "Beige",
  "#40e0d0": "Turquoise",
  "#000080": "Navy",
  "#800000": "Maroon",
};

const NAMED_COLOR_PALETTE = [
  ["Black", "#000000"], ["White", "#ffffff"], ["Gray", "#808080"], ["Silver", "#c0c0c0"],
  ["Red", "#ff0000"], ["Maroon", "#800000"], ["Pink", "#ffc0cb"], ["Rose", "#f43f5e"],
  ["Orange", "#ffa500"], ["Amber", "#f59e0b"], ["Yellow", "#ffff00"], ["Gold", "#d4af37"],
  ["Brown", "#a52a2a"], ["Beige", "#f5f5dc"], ["Green", "#008000"], ["Lime", "#00ff00"],
  ["Olive", "#808000"], ["Mint", "#98ff98"], ["Teal", "#008080"], ["Turquoise", "#40e0d0"],
  ["Blue", "#0000ff"], ["Navy", "#000080"], ["Sky Blue", "#0ea5e9"], ["Cyan", "#00ffff"],
  ["Purple", "#800080"], ["Violet", "#8b5cf6"], ["Indigo", "#4f46e5"], ["Lavender", "#e6e6fa"],
];

const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex).replace("#", "");
  if (normalized.length !== 6) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const nearestColorName = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Color";
  let nearest = "Color";
  let smallestDistance = Number.POSITIVE_INFINITY;
  for (const [name, paletteHex] of NAMED_COLOR_PALETTE) {
    const paletteRgb = hexToRgb(paletteHex);
    const distance =
      Math.pow(rgb.r - paletteRgb.r, 2) +
      Math.pow(rgb.g - paletteRgb.g, 2) +
      Math.pow(rgb.b - paletteRgb.b, 2);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearest = name;
    }
  }
  return nearest;
};

const isHexColor = (value = "") => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(value).trim());

const normalizeHex = (value = "") => {
  const trimmed = String(value).trim().toLowerCase();
  if (!isHexColor(trimmed)) return trimmed;
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return trimmed;
};

const toTitleCase = (value = "") =>
  String(value)
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getReadableColorName = (colorInput) => {
  const rawValue = typeof colorInput === "string"
    ? colorInput
    : colorInput?.name || colorInput?.label || colorInput?.hex || colorInput?.title || "";

  const normalized = normalizeHex(rawValue);
  if (!normalized) return "Selected Shade";
  if (HEX_TO_NAME[normalized]) return HEX_TO_NAME[normalized];
  if (isHexColor(normalized)) return nearestColorName(normalized);
  return toTitleCase(normalized);
};

module.exports = {
  getReadableColorName,
  normalizeHex,
  isHexColor,
};
