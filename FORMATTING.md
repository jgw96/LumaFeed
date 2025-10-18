# Prettier Code Formatting

This project uses [Prettier](https://prettier.io/) for consistent code formatting.

## Configuration

Prettier is configured in `.prettierrc` with the following rules:
- **Semi-colons**: Always add semicolons
- **Quotes**: Single quotes for strings
- **Print Width**: 100 characters
- **Tab Width**: 2 spaces
- **Trailing Commas**: ES5 compatible (objects, arrays, etc.)
- **Arrow Function Parens**: Always include parentheses
- **Line Endings**: LF (Unix-style)

## Usage

### Format all files
```bash
npm run format
```

### Check formatting without making changes
```bash
npm run format:check
```

## Editor Integration

### VS Code
Install the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and add to your `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

### Other Editors
See the [Prettier Editor Integration docs](https://prettier.io/docs/en/editors.html) for setup instructions.

## Files Excluded

The following files/directories are excluded from formatting (see `.prettierignore`):
- Build outputs (`dist`, `coverage`)
- Dependencies (`node_modules`)
- Generated files (service worker bundles)
- Lock files and logs
