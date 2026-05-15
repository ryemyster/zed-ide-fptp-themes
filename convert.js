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

  const style = {
    background: colors["editor.background"] || (isDark ? "#1e1e1e" : "#ffffff"),
    foreground: colors["editor.foreground"] || (isDark ? "#d4d4d4" : "#333333"),
  };

  // Map common VSCode colors to Zed style properties
  if (colors["editorCursor.foreground"]) {
    style.cursor = colors["editorCursor.foreground"];
  }
  if (colors["editor.selectionBackground"]) {
    style.selection = colors["editor.selectionBackground"];
  }
  if (colors["editor.lineHighlightBackground"]) {
    style.line_highlight = colors["editor.lineHighlightBackground"];
  }
  if (colors["editorLineNumber.foreground"]) {
    style.line_number = colors["editorLineNumber.foreground"];
  }
  if (colors["editorLineNumber.activeForeground"]) {
    style.line_number_active = colors["editorLineNumber.activeForeground"];
  }
  if (colors["editor.findMatchBackground"]) {
    style.find_match = colors["editor.findMatchBackground"];
  }
  if (colors["editorError.foreground"]) {
    style.error = colors["editorError.foreground"];
  }
  if (colors["editorWarning.foreground"]) {
    style.warning = colors["editorWarning.foreground"];
  }
  if (colors["editorInfo.foreground"]) {
    style.info = colors["editorInfo.foreground"];
  }

  // Add syntax highlighting from semantic tokens
  const semanticTokens = vscodeTheme.semanticTokenColors || {};
  Object.entries(semanticTokens).forEach(([tokenType, color]) => {
    style[tokenType] = color;
  });

  // Fallback to tokenColors if semantic tokens are empty
  if (Object.keys(semanticTokens).length === 0) {
    const tokenColors = vscodeTheme.tokenColors || [];
    tokenColors.forEach((tokenColor) => {
      const scopes = Array.isArray(tokenColor.scope)
        ? tokenColor.scope
        : [tokenColor.scope];
      const color = tokenColor.settings?.foreground;

      scopes.forEach((scope) => {
        if (color && !style[scope]) {
          style[scope] = color;
        }
      });
    });
  }

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
