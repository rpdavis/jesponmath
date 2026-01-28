# Using Chrome DevTools Overrides with Vue Files

## Quick Setup for CSS Editing

### Method 1: Direct Override (for compiled CSS)
1. Open DevTools → **Sources** tab
2. Click **Overrides** in left sidebar (if not visible, click `>>` to expand)
3. Click **+ Select folder for overrides**
4. Create/select a folder (e.g., `devtools-overrides/`)
5. In **Page** tab, find the CSS file (might be in a bundle)
6. Right-click → **Save for overrides**
7. Now edit CSS in **Elements** → **Styles** panel
8. Changes auto-save to the overrides file

### Method 2: Manual Copy (Recommended for Vue SFC)
Since Vue compiles `.vue` files, the CSS in browser is bundled. Better workflow:

1. **Edit in DevTools**:
   - Inspect element
   - Edit CSS in **Styles** panel
   - Test changes live

2. **Copy the changes**:
   - Right-click the CSS rule → **Copy rule**
   - Or manually note the property changes

3. **Apply to Vue file**:
   - Open `src/views/WordProblemFramesResource.vue`
   - Find the CSS class (search for class name)
   - Update the styles in `<style scoped>` section

### CSS Locations in WordProblemFramesResource.vue

- **Circle indicators**: Line ~1025 (`:deep(.circle-indicator)`)
- **Underline indicators**: Line ~1041 (`:deep(.underline-indicator)`)
- **Box indicators**: Line ~1052 (`:deep(.box-indicator)`)
- **Problem text**: Line ~984 (`.problem-text`)
- **Equation text**: Line ~1002 (`.equation-text`)

### Pro Tips

1. **Use Computed Styles**: In DevTools, check **Computed** tab to see final values
2. **Copy All Declarations**: Right-click rule → **Copy all declarations**
3. **Search in Vue file**: Use Cmd+F / Ctrl+F to find class names quickly
4. **Remember `:deep()`**: Vue scoped styles need `:deep()` for `v-html` content

### Example Workflow

1. Inspect circled number → see `.circle-indicator` in DevTools
2. Edit `border: 4px solid #3b82f6` in Styles panel
3. Test and refine
4. Copy the rule: `border: 4px solid #3b82f6;`
5. Open Vue file, go to line 1025-1034
6. Update the `:deep(.circle-indicator)` rule
7. Save and refresh
