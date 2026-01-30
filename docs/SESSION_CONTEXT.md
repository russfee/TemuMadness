# Session Context

## Session updates
- 2026-01-22: Updated AGENTS.md paths to use docs/* and remove ProjectTemplate references. Current status: paths cleaned. Next steps: none.
- 2026-01-30: Added app-specific mappings via bundle ID in UI + Karabiner conditions. Current status: supports multiple app-specific mappings for the same button without double-firing. Next steps: confirm mappings work per app.
- 2026-01-30: Added bundle ID helper chips for common apps in the UI. Current status: quick-fill bundle IDs available. Next steps: confirm helper list is adequate.
- 2026-01-30: Temporarily disable Temu rules during detection to avoid remapped shortcuts. Current status: detect should capture original button again. Next steps: verify detection flow after mapping.
- 2026-01-30: Added debug panel to preview generated Karabiner rules from saved config. Current status: can inspect app conditions. Next steps: verify preview matches applied rules.
- 2026-01-30: Normalize shortcut capture using e.code for letter/number keys to avoid Option-modified glyphs. Current status: alt/option combos should no longer capture symbols. Next steps: verify option+cmd combos capture expected letter.

## What this repo is
- One sentence: Helps custom map buttons on a Temu side keyboard.

## Current goal
- Design tweaks and functionality upgrades.

## Where to look first
- docs/

## Known issues / risks
- Don't accidentally take over the main keyboard.

## How to validate
- Refresh the webpage running local.
