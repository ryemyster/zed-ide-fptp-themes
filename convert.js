const fs = require("fs");
const path = require("path");

const VSCODE_THEMES_DIR =
  "/Users/rmcdonald/Repos/ryemyster/vscode-themes-vibecoded/themes";
const OUTPUT_DIR = "/Users/rmcdonald/Repos/ryemyster/zed-themes/themes";
const SCHEMA_URL = "https://zed.dev/schema/themes/v0.2.0.json";
const MIN_TERMINAL_CONTRAST = 4.5;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function guessThemeType(vscodeName) {
  const name = vscodeName.toLowerCase();
  return (
    name.includes("light") ||
    name.includes("day") ||
    name.includes("whiteboard") ||
    name.includes("clarity")
  )
    ? "light"
    : "dark";
}

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

  const channels = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
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

function ensureTerminalContrast(color, background) {
  const ratio = contrastRatio(color, background);
  if (ratio === null || ratio >= MIN_TERMINAL_CONTRAST) return color;

  const blackContrast = contrastRatio("#000000", background);
  const whiteContrast = contrastRatio("#FFFFFF", background);
  const target = blackContrast > whiteContrast ? "#000000" : "#FFFFFF";
  let low = 0;
  let high = 1;

  for (let iteration = 0; iteration < 12; iteration++) {
    const midpoint = (low + high) / 2;
    if (contrastRatio(mixColors(color, target, midpoint), background) >= MIN_TERMINAL_CONTRAST) {
      high = midpoint;
    } else {
      low = midpoint;
    }
  }

  return mixColors(color, target, high);
}

// Maps VSCode tokenColor scopes to Zed syntax token names
const SCOPE_TO_ZED = {
  "comment": "comment",
  "punctuation.definition.comment": "comment",
  "string": "string",
  "string.quoted": "string",
  "constant.other.symbol": "string",
  "markup.heading": "title",
  "constant.numeric": "number",
  "constant.language": "boolean",
  "support.constant": "constant",
  "keyword": "keyword",
  "storage.type": "keyword",
  "storage.modifier": "keyword",
  "entity.name.function": "function",
  "support.function": "function",
  "meta.function-call": "function",
  "variable": "variable",
  "meta.definition.variable.name": "variable",
  "support.variable": "variable",
  "variable.parameter": "variable.special",
  "meta.parameter": "variable.special",
  "entity.name.type": "type",
  "entity.name.class": "type",
  "support.type": "type",
  "support.class": "type",
  "entity.other.attribute-name": "attribute",
  "support.type.property-name": "property",
  "meta.object-literal.key": "property",
  "punctuation": "punctuation",
  "meta.brace": "punctuation",
  "meta.delimiter": "punctuation",
  "invalid": "invalid",
  "invalid.illegal": "invalid",
};

function convertTheme(vscodeTheme) {
  const themeName = vscodeTheme.name || "Untitled Theme";
  const isDark = (vscodeTheme.type || guessThemeType(themeName)) === "dark";
  const colors = vscodeTheme.colors || {};

  const bg = colors["editor.background"] || (isDark ? "#1e1e1e" : "#ffffff");
  const fg = colors["editor.foreground"] || (isDark ? "#d4d4d4" : "#333333");

  const style = {};
  const set = (key, value) => { if (value) style[key] = value; };

  // Base
  set("background", bg);
  set("text", fg);
  set("editor.background", bg);
  set("editor.foreground", fg);

  // Editor chrome
  set("editor.line_number", colors["editorLineNumber.foreground"]);
  set("editor.active_line_number", colors["editorLineNumber.activeForeground"]);
  set("editor.active_line.background", colors["editor.lineHighlightBackground"]);
  set("editor.gutter.background", colors["editorGutter.background"] || bg);
  set("editor.indent_guide", colors["editorIndentGuide.background1"]);
  set("editor.indent_guide_active", colors["editorIndentGuide.activeBackground1"]);
  set("editor.document_highlight.read_background", colors["editor.wordHighlightBackground"]);
  set("editor.document_highlight.write_background", colors["editor.wordHighlightStrongBackground"]);

  // Search
  set("search.match_background", colors["editor.findMatchBackground"]);

  // Diagnostics
  set("error", colors["editorError.foreground"]);
  set("warning", colors["editorWarning.foreground"]);
  set("info", colors["editorInfo.foreground"]);
  set("hint", colors["editorInfo.foreground"]);
  set("success", colors["editorGutter.addedBackground"] || colors["gitDecoration.addedResourceForeground"]);

  // VCS decorations
  set("created", colors["editorGutter.addedBackground"] || colors["gitDecoration.addedResourceForeground"]);
  set("deleted", colors["editorGutter.deletedBackground"] || colors["gitDecoration.deletedResourceForeground"]);
  set("modified", colors["editorGutter.modifiedBackground"] || colors["gitDecoration.modifiedResourceForeground"]);
  set("conflict", colors["gitDecoration.conflictingResourceForeground"]);
  set("ignored", colors["gitDecoration.ignoredResourceForeground"]);
  set("hidden", colors["gitDecoration.ignoredResourceForeground"]);
  set("renamed", colors["gitDecoration.renamedResourceForeground"]);

  // Borders
  set("border", colors["contrastBorder"]);
  set("border.focused", colors["focusBorder"]);
  set("border.selected", colors["focusBorder"]);
  set("border.variant", colors["editorGroup.border"]);

  // Elements (list/tree items)
  set("element.background", colors["list.hoverBackground"]);
  set("element.hover", colors["list.hoverBackground"]);
  set("element.active", colors["list.activeSelectionBackground"]);
  set("element.selected", colors["list.activeSelectionBackground"]);
  set("element.disabled", colors["list.inactiveSelectionBackground"]);
  set("ghost_element.hover", colors["list.hoverBackground"]);
  set("ghost_element.active", colors["list.activeSelectionBackground"]);
  set("ghost_element.selected", colors["list.inactiveSelectionBackground"]);

  // Text
  set("text.muted", colors["descriptionForeground"]);
  set("text.placeholder", colors["input.placeholderForeground"]);
  set("text.accent", colors["list.highlightForeground"]);

  // Icon
  set("icon.muted", colors["activityBar.inactiveForeground"]);

  // Layout surfaces
  set("surface.background", colors["sideBar.background"]);
  set("panel.background", colors["panel.background"] || colors["sideBar.background"]);
  set("panel.focused_border", colors["panel.border"]);
  set("elevated_surface.background", colors["dropdown.background"] || colors["editorSuggestWidget.background"]);
  set("drop_target.background", colors["editor.selectionBackground"]);

  // Bars
  set("status_bar.background", colors["statusBar.background"]);
  set("title_bar.background", colors["titleBar.activeBackground"]);
  set("title_bar.inactive_background", colors["titleBar.inactiveBackground"]);
  set("toolbar.background", colors["editorGroupHeader.tabsBackground"]);

  // Tabs
  set("tab_bar.background", colors["editorGroupHeader.tabsBackground"]);
  set("tab.active_background", colors["tab.activeBackground"]);
  set("tab.inactive_background", colors["tab.inactiveBackground"]);

  // Scrollbar
  set("scrollbar.thumb.background", colors["scrollbarSlider.background"]);
  set("scrollbar.thumb.hover_background", colors["scrollbarSlider.hoverBackground"]);
  set("scrollbar.thumb.border", colors["scrollbarSlider.background"]);
  set("scrollbar.track.background", colors["editorGutter.background"] || bg);
  set("scrollbar.track.border", colors["editorGutter.background"] || bg);

  // Terminal
  const terminalBackground = colors["terminal.background"] || bg;
  const setTerminalColor = (key, color) => {
    set(key, ensureTerminalContrast(color, terminalBackground));
  };

  set("terminal.background", terminalBackground);
  setTerminalColor("terminal.foreground", colors["terminal.foreground"] || fg);
  setTerminalColor("terminal.ansi.black", colors["terminal.ansiBlack"]);
  setTerminalColor("terminal.ansi.red", colors["terminal.ansiRed"]);
  setTerminalColor("terminal.ansi.green", colors["terminal.ansiGreen"]);
  setTerminalColor("terminal.ansi.yellow", colors["terminal.ansiYellow"]);
  setTerminalColor("terminal.ansi.blue", colors["terminal.ansiBlue"]);
  setTerminalColor("terminal.ansi.magenta", colors["terminal.ansiMagenta"]);
  setTerminalColor("terminal.ansi.cyan", colors["terminal.ansiCyan"]);
  setTerminalColor("terminal.ansi.white", colors["terminal.ansiWhite"]);
  setTerminalColor("terminal.ansi.bright_black", colors["terminal.ansiBrightBlack"]);
  setTerminalColor("terminal.ansi.bright_red", colors["terminal.ansiBrightRed"]);
  setTerminalColor("terminal.ansi.bright_green", colors["terminal.ansiBrightGreen"]);
  setTerminalColor("terminal.ansi.bright_yellow", colors["terminal.ansiBrightYellow"]);
  setTerminalColor("terminal.ansi.bright_blue", colors["terminal.ansiBrightBlue"]);
  setTerminalColor("terminal.ansi.bright_magenta", colors["terminal.ansiBrightMagenta"]);
  setTerminalColor("terminal.ansi.bright_cyan", colors["terminal.ansiBrightCyan"]);
  setTerminalColor("terminal.ansi.bright_white", colors["terminal.ansiBrightWhite"]);

  // Players: cursor and selection colors
  style.players = [
    {
      cursor: colors["editorCursor.foreground"] || (isDark ? "#CCCCCC" : "#000000"),
      selection: colors["editor.selectionBackground"] || (isDark ? "#264F78" : "#ADD6FF"),
      background: colors["editorCursor.foreground"] || (isDark ? "#CCCCCC" : "#000000"),
    },
  ];

  // Syntax highlighting: map VSCode tokenColors to Zed syntax tokens
  const syntax = {};
  const tokenColors = vscodeTheme.tokenColors || [];

  tokenColors.forEach((tokenColor) => {
    const scopes = Array.isArray(tokenColor.scope)
      ? tokenColor.scope
      : [tokenColor.scope];
    const color = tokenColor.settings?.foreground;
    const fontStyle = tokenColor.settings?.fontStyle;

    scopes.forEach((scope) => {
      if (!scope) return;
      const zedKey = SCOPE_TO_ZED[scope];
      if (zedKey && !syntax[zedKey]) {
        const entry = {};
        if (color) entry.color = color;
        if (fontStyle === "italic") entry.font_style = "italic";
        if (fontStyle === "bold") entry.font_weight = 700;
        syntax[zedKey] = entry;
      }
    });
  });

  style.syntax = syntax;

  return {
    name: themeName,
    appearance: isDark ? "dark" : "light",
    style,
  };
}

const files = fs.readdirSync(VSCODE_THEMES_DIR).filter((f) => f.endsWith(".json"));
console.log(`Found ${files.length} VSCode themes to convert...`);

const results = { success: 0, failed: 0, errors: [] };

files.forEach((file) => {
  try {
    const filepath = path.join(VSCODE_THEMES_DIR, file);
    const vscodeTheme = JSON.parse(fs.readFileSync(filepath, "utf8"));
    const zedTheme = convertTheme(vscodeTheme);

    const themeFamily = {
      $schema: SCHEMA_URL,
      name: "Pixels to Punk",
      author: "Ryan McDonald",
      themes: [zedTheme],
    };

    const baseName = file.replace("-color-theme.json", "");
    const outputFile = path.join(OUTPUT_DIR, `${baseName}.json`);

    fs.writeFileSync(outputFile, JSON.stringify(themeFamily, null, 2));
    results.success++;
    console.log(`✓ Converted: ${file}`);
  } catch (error) {
    results.failed++;
    results.errors.push({ file, error: error.message });
    console.error(`✗ Failed: ${file} - ${error.message}`);
  }
});

console.log("\n--- Conversion Summary ---");
console.log(`✓ Success: ${results.success}`);
console.log(`✗ Failed: ${results.failed}`);

if (results.errors.length > 0) {
  console.log("\nErrors:");
  results.errors.forEach(({ file, error }) => {
    console.log(`  ${file}: ${error}`);
  });
}
