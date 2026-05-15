# Development Guide

## Project Structure

```
zed-themes/
├── extension.toml          # Extension metadata
├── package.json            # Node dependencies
├── convert.js              # Conversion script (VSCode → Zed)
├── themes/                 # Generated Zed theme files (50 themes)
├── README.md               # User documentation
├── LICENSE                 # MIT License
└── DEVELOPMENT.md          # This file
```

## How the Conversion Works

The `convert.js` script:
1. Reads all VSCode theme files from the source repo
2. Extracts colors and syntax highlighting rules
3. Maps them to Zed's theme format
4. Generates JSON files in the `themes/` directory

Key mappings:
- **editor.background** → `colors.background`
- **editor.foreground** → `colors.foreground`
- **editorCursor.foreground** → `colors.cursor`
- **semanticTokenColors** → `syntax` object

## Regenerating Themes

If you update the VSCode themes source or modify the conversion script:

```bash
npm run convert
```

This regenerates all themes in `themes/`.

## Adding a New Theme

1. Add the VSCode theme to the source repo
2. Run `npm run convert`
3. Commit the new theme file(s)

## Modifying the Conversion Script

The conversion happens in `convert.js`. Key functions:
- `convertTheme()` - Main conversion logic
- `guessThemeType()` - Determines light/dark appearance
- Color mapping and syntax highlighting extraction

Update these functions if:
- You need to map additional VSCode colors to Zed
- You want different syntax highlighting handling
- You need to add theme-specific overrides

## Testing Locally

To test a theme before publishing:

1. Link the extension:
   ```bash
   ln -s /path/to/zed-themes ~/.config/zed/extensions/fptp-themes
   ```

2. Restart Zed

3. Select the theme in Settings

4. Verify colors and syntax highlighting look correct

## Publishing to Zed Registry

Once ready to publish:

1. Update version in `extension.toml`
2. Commit changes
3. Tag release: `git tag v1.x.x`
4. Push to GitHub
5. Submit to Zed extensions registry via GitHub PR

See [Zed extension docs](https://zed.dev/docs/extensions) for details.
