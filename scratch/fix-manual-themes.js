const fs = require("fs");
const path = require("path");

const THEMES_DIR = path.resolve(__dirname, "../themes");
const MIN_TEXT_CONTRAST = 4.5;
const MIN_UI_CONTRAST = 3;

function parseHexColor(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color || "");
  if (!match) return null;

  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHexColor(rgb) {
  return `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
}

function relativeLuminance(color) {
  const rgb = parseHexColor(color);
  if (!rgb) return null;

  return rgb
    .map((value) => {
      const channel = value / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  if (foregroundLuminance === null || backgroundLuminance === null) return null;

  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function mixColors(color, target, amount) {
  const rgb = parseHexColor(color);
  const targetRgb = parseHexColor(target);
  if (!rgb || !targetRgb) return color;

  return toHexColor(rgb.map((value, index) => value + (targetRgb[index] - value) * amount));
}

function ensureContrast(color, background, minContrast) {
  const ratio = contrastRatio(color, background);
  if (ratio === null || ratio >= minContrast) return color;

  const target = contrastRatio("#000000", background) > contrastRatio("#FFFFFF", background)
    ? "#000000"
    : "#FFFFFF";
  let low = 0;
  let high = 1;

  for (let iteration = 0; iteration < 12; iteration++) {
    const midpoint = (low + high) / 2;
    if (contrastRatio(mixColors(color, target, midpoint), background) >= minContrast) {
      high = midpoint;
    } else {
      low = midpoint;
    }
  }

  return mixColors(color, target, high);
}

function ensureStyleContrast(style, key, backgroundKey, minContrast) {
  const color = style[key];
  const background = style[backgroundKey];
  if (!color || !background) return;

  const adjusted = ensureContrast(color.slice(0, 7), background.slice(0, 7), minContrast);
  style[key] = color.length > 7 ? `${adjusted}${color.slice(7)}` : adjusted;
}

for (const file of fs.readdirSync(THEMES_DIR).filter((entry) => entry.endsWith(".json"))) {
  const filepath = path.join(THEMES_DIR, file);
  const data = JSON.parse(fs.readFileSync(filepath, "utf8"));
  let modified = false;

  for (const theme of data.themes || []) {
    const style = theme.style || {};
    const before = JSON.stringify(style);

    [
      ["editor.foreground", "editor.background", MIN_TEXT_CONTRAST],
      ["text", "background", MIN_TEXT_CONTRAST],
      ["text.muted", "background", MIN_TEXT_CONTRAST],
      ["text.placeholder", "background", MIN_TEXT_CONTRAST],
      ["text.accent", "background", MIN_TEXT_CONTRAST],
      ["editor.line_number", "editor.background", MIN_UI_CONTRAST],
      ["editor.active_line_number", "editor.background", MIN_TEXT_CONTRAST],
      ["icon.muted", "background", MIN_UI_CONTRAST],
      ["terminal.foreground", "terminal.background", MIN_TEXT_CONTRAST],
    ].forEach(([key, backgroundKey, minContrast]) => {
      ensureStyleContrast(style, key, backgroundKey, minContrast);
    });

    for (const key of Object.keys(style).filter((entry) => entry.startsWith("terminal.ansi."))) {
      ensureStyleContrast(style, key, "terminal.background", MIN_TEXT_CONTRAST);
    }

    if (JSON.stringify(style) !== before) modified = true;
  }

  if (modified) {
    fs.writeFileSync(filepath, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`fixed ${file}`);
  }
}
