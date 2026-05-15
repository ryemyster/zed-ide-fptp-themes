const fs = require("fs");
const path = require("path");

const VSCODE_THEMES_DIR =
  "/Users/rmcdonald/Repos/ryemyster/vscode-themes-vibecoded/themes";
const OUTPUT_DIR = "/Users/rmcdonald/Repos/ryemyster/zed-themes/themes";
const SCHEMA_URL = "https://zed.dev/schema/themes/v0.2.0.json";

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

function convertTheme(vscodeTheme, filename) {
  const themeName = vscodeTheme.name || "Untitled Theme";
  const isDark = guessThemeType(themeName) === "dark";
  const colors = vscodeTheme.colors || {};

  const bg = colors["editor.background"] || (isDark ? "#1e1e1e" : "#ffffff");
  const fg = colors["editor.foreground"] || (isDark ? "#d4d4d4" : "#333333");

  const style = {
    background: bg,
    foreground: fg,
    cursor: colors["editorCursor.foreground"] || (isDark ? "#CCCCCC" : "#000000"),
    selection: colors["editor.selectionBackground"],
    line_highlight: colors["editor.lineHighlightBackground"],

    // Editor UI
    gutter: {
      background: colors["editorGutter.background"] || bg,
      foreground: colors["editorLineNumber.foreground"],
    },
    line_number: {
      active: colors["editorLineNumber.activeForeground"],
    },

    // Search/highlighting
    find_match: colors["editor.findMatchBackground"],
    find_match_highlight: colors["editor.findMatchHighlightBackground"],
    document_highlight_read: colors["editor.wordHighlightBackground"],
    document_highlight_write: colors["editor.wordHighlightStrongBackground"],

    // Diagnostics
    error: colors["editorError.foreground"],
    warning: colors["editorWarning.foreground"],
    info: colors["editorInfo.foreground"],
    hint: colors["editorInfo.foreground"],

    // Editor brackets
    brackets: {
      background: colors["editorBracketHighlight.background"],
      foreground1: colors["editorBracketHighlight.foreground1"],
      foreground2: colors["editorBracketHighlight.foreground2"],
      foreground3: colors["editorBracketHighlight.foreground3"],
    },

    // Indentation guide
    indent_guide: {
      background: colors["editorIndentGuide.background1"],
      active_background: colors["editorIndentGuide.activeBackground1"],
    },

    // Gutter decorations
    created: colors["editorGutter.addedBackground"] || colors["gitDecoration.addedResourceForeground"],
    deleted: colors["editorGutter.deletedBackground"] || colors["gitDecoration.deletedResourceForeground"],
    modified: colors["editorGutter.modifiedBackground"] || colors["gitDecoration.modifiedResourceForeground"],

    // UI Elements
    element: {
      background: colors["list.hoverBackground"],
      hover: colors["list.hoverBackground"],
      active: colors["list.activeSelectionBackground"],
      selected: colors["list.activeSelectionBackground"],
      disabled: colors["list.inactiveSelectionBackground"],
    },

    // Text/focus
    text: {
      muted: colors["descriptionForeground"],
      placeholder: colors["input.placeholderForeground"],
    },

    focus_border: colors["focusBorder"],
    border: colors["contrastBorder"],

    // Button
    button: {
      background: colors["button.background"],
      hover_background: colors["button.hoverBackground"],
      foreground: colors["button.foreground"],
    },

    // Input
    input: {
      background: colors["input.background"],
      border: colors["input.border"],
      foreground: colors["input.foreground"],
      placeholder_foreground: colors["input.placeholderForeground"],
    },

    // Panels and sidebar
    panel: {
      background: colors["panel.background"],
      border: colors["panel.border"],
    },
    sidebar: {
      background: colors["sideBar.background"],
      border: colors["sideBar.border"],
      foreground: colors["sideBar.foreground"],
    },
    status_bar: {
      background: colors["statusBar.background"],
      foreground: colors["statusBar.foreground"],
    },
    title_bar: {
      background: colors["titleBar.activeBackground"],
      foreground: colors["titleBar.activeForeground"],
    },
    tab: {
      active_background: colors["tab.activeBackground"],
      active_foreground: colors["tab.activeForeground"],
      inactive_background: colors["tab.inactiveBackground"],
      inactive_foreground: colors["tab.inactiveForeground"],
      bar_background: colors["editorGroupHeader.tabsBackground"],
    },

    // Terminal colors
    terminal: {
      background: colors["terminal.background"],
      foreground: colors["terminal.foreground"],
      ansi: {
        black: colors["terminal.ansiBlack"],
        red: colors["terminal.ansiRed"],
        green: colors["terminal.ansiGreen"],
        yellow: colors["terminal.ansiYellow"],
        blue: colors["terminal.ansiBlue"],
        magenta: colors["terminal.ansiMagenta"],
        cyan: colors["terminal.ansiCyan"],
        white: colors["terminal.ansiWhite"],
        bright_black: colors["terminal.ansiBrightBlack"],
        bright_red: colors["terminal.ansiBrightRed"],
        bright_green: colors["terminal.ansiBrightGreen"],
        bright_yellow: colors["terminal.ansiBrightYellow"],
        bright_blue: colors["terminal.ansiBrightBlue"],
        bright_magenta: colors["terminal.ansiBrightMagenta"],
        bright_cyan: colors["terminal.ansiBrightCyan"],
        bright_white: colors["terminal.ansiBrightWhite"],
      },
    },

    // Scrollbar
    scrollbar: {
      thumb: {
        background: colors["scrollbarSlider.background"],
        hover_background: colors["scrollbarSlider.hoverBackground"],
        active_background: colors["scrollbarSlider.activeBackground"],
      },
    },

    // Dropdown/menu
    dropdown: {
      background: colors["dropdown.background"],
      border: colors["dropdown.border"],
      foreground: colors["dropdown.foreground"],
    },
    menu: {
      background: colors["menu.background"],
      foreground: colors["menu.foreground"],
      selection: colors["menu.selectionBackground"],
    },
  };

  // Extract syntax highlighting from token colors as flat properties
  const tokenColors = vscodeTheme.tokenColors || [];

  tokenColors.forEach((tokenColor) => {
    const scopes = Array.isArray(tokenColor.scope)
      ? tokenColor.scope
      : [tokenColor.scope];
    const color = tokenColor.settings?.foreground;

    scopes.forEach((scope) => {
      if (color && scope) {
        const key = scope
          .replace(/\./g, "_")
          .replace(/-/g, "_")
          .toLowerCase();

        if (!style[key]) {
          style[key] = color;
        }
      }
    });
  });

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
    const zedTheme = convertTheme(vscodeTheme, file);

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
