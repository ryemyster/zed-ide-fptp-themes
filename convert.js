const fs = require("fs");
const path = require("path");

const VSCODE_THEMES_DIR =
  "/Users/rmcdonald/Repos/ryemyster/vscode-themes-vibecoded/themes";
const OUTPUT_DIR = "/Users/rmcdonald/Repos/ryemyster/zed-themes/themes";

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Map VSCode color keys to Zed equivalents
const colorMapping = {
  "editor.background": "background",
  "editor.foreground": "text",
  "editor.lineHighlightBackground": "line_number_background",
  "editor.selectionBackground": "selection_background",
  "editor.findMatchBackground": "find_match_background",
  "editorCursor.foreground": "cursor",
  "editorLineNumber.foreground": "line_number",
  "editorLineNumber.activeForeground": "line_number_active",
  "editorError.foreground": "error",
  "editorWarning.foreground": "warning",
  "editorInfo.foreground": "info",
  "editorBracketHighlight.foreground1": "bracket_1",
  "editorBracketHighlight.foreground2": "bracket_2",
  "editorBracketHighlight.foreground3": "bracket_3",
  "editorGutter.addedBackground": "added",
  "editorGutter.modifiedBackground": "modified",
  "editorGutter.deletedBackground": "deleted",
};

// Map token scopes to Zed syntax highlighting
const syntaxMapping = {
  keyword: ["keyword"],
  string: ["string"],
  number: ["number"],
  "entity.name.function": ["function"],
  "entity.name.class": ["type"],
  variable: ["variable"],
  comment: ["comment"],
  "markup.italic": ["italic"],
  "markup.bold": ["bold"],
  punctuation: ["punctuation"],
};

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

  const zedTheme = {
    name: themeName,
    appearance: isDark ? "dark" : "light",
  };

  // Extract main colors
  const colors = vscodeTheme.colors || {};

  // Base colors
  zedTheme.colors = {
    background: colors["editor.background"] || (isDark ? "#1e1e1e" : "#ffffff"),
    foreground: colors["editor.foreground"] || (isDark ? "#d4d4d4" : "#333333"),
  };

  // UI colors
  if (colors["editorCursor.foreground"]) {
    zedTheme.colors.cursor = colors["editorCursor.foreground"];
  }
  if (colors["editor.selectionBackground"]) {
    zedTheme.colors.selection = colors["editor.selectionBackground"];
  }
  if (colors["editor.lineHighlightBackground"]) {
    zedTheme.colors.line_highlight = colors["editor.lineHighlightBackground"];
  }

  // Syntax highlighting colors from semantic tokens
  zedTheme.syntax = {};
  const semanticTokens = vscodeTheme.semanticTokenColors || {};

  Object.entries(semanticTokens).forEach(([tokenType, color]) => {
    zedTheme.syntax[tokenType] = { color, weight: "normal" };
  });

  // Fallback syntax from token colors if semantic tokens missing
  if (Object.keys(zedTheme.syntax).length === 0) {
    const tokenColors = vscodeTheme.tokenColors || [];
    tokenColors.forEach((tokenColor) => {
      const scopes = Array.isArray(tokenColor.scope)
        ? tokenColor.scope
        : [tokenColor.scope];
      const color = tokenColor.settings?.foreground;

      scopes.forEach((scope) => {
        const key = scope.split(".")[0];
        if (color && !zedTheme.syntax[key]) {
          zedTheme.syntax[key] = { color, weight: "normal" };
        }
      });
    });
  }

  return zedTheme;
}

// Read and convert all themes
const files = fs.readdirSync(VSCODE_THEMES_DIR).filter((f) => f.endsWith(".json"));

console.log(`Found ${files.length} VSCode themes to convert...`);

const results = {
  success: 0,
  failed: 0,
  errors: [],
};

files.forEach((file) => {
  try {
    const filepath = path.join(VSCODE_THEMES_DIR, file);
    const vscodeTheme = JSON.parse(fs.readFileSync(filepath, "utf8"));

    const zedTheme = convertTheme(vscodeTheme, file);

    // Generate output filename
    const baseName = file.replace("-color-theme.json", "");
    const outputFile = path.join(OUTPUT_DIR, `${baseName}.json`);

    fs.writeFileSync(outputFile, JSON.stringify(zedTheme, null, 2));
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
