# UI Design

The UI is split into shared, setup, and game styling:

- `styles/common.css`: theme colors, design tokens, typography, global layout, shared buttons, focus states.
- `styles/setup.css`: setup screen, player panels, radio/segmented controls, dictionary select, keyboard hints.
- `styles/game.css`: game header, toolbar, scoreboard, reading prompt, canvas arena, overlay.

## Main Design Tokens

Most high-level knobs are defined in `styles/common.css` under `:root`:

| Token | Controls |
| --- | --- |
| `--font-body` | Main app font stack |
| `--font-mono` | Keyboard hint font stack |
| `--page-max-width` | Maximum width of the app shell |
| `--page-gutter` | Horizontal page gutter on desktop/tablet |
| `--page-padding-block` | Top and bottom page padding |
| `--radius` | Main radius for panels, controls, arena, cards |
| `--radius-small` | Smaller radius for player color marks and keycaps |
| `--control-height` | Text, color, and select control height |
| `--primary-button-height` | Start/resume button height |
| `--icon-button-size` | Pause, restart, and setup button size |
| `--title-size` | Setup screen main heading size |
| `--game-title-size` | Game screen heading size |
| `--target-word-size` | Reading-mode target word size |

Theme color tokens are also in `styles/common.css`. The dark theme is `:root`; the light theme overrides values in `:root[data-theme="light"]`.

## Where To Change Layout

Setup screen layout:

- `styles/setup.css` `.setup-screen`: two-column desktop layout.
- `styles/setup.css` `.setup-form`: vertical spacing between form sections.
- `styles/setup.css` `.settings-grid`: challenge, speed, field size, dictionary, and theme grid.
- `styles/setup.css` media queries at `840px` and `520px`: tablet and mobile layout changes.

Game screen layout:

- `styles/game.css` `.game-screen`: spacing between header, scoreboard, prompt, and arena.
- `styles/game.css` `.game-header`: title and toolbar alignment.
- `styles/game.css` `.scoreboard`: one or two score columns.
- `styles/game.css` `.reading-prompt`: target-word panel width and spacing.
- `styles/game.css` `.arena-wrap`: canvas frame and aspect ratio.
- `styles/game.css` `.mobile-controls`: phone D-pad below the arena.

Canvas board size:

- `src/config.js` `CELL_SIZE` sets the baseline preferred cell size.
- `src/config.js` `FIELD_SIZES` sets fixed board columns and rows, plus the `auto` sizing bounds.
- `src/presentation/renderer.js` sets `--arena-preferred-width` at runtime so the reading prompt aligns with the arena.
- `src/presentation/ui.js` measures viewport room for `auto`, including header and phone D-pad space.
- On phones, `src/presentation/ui.js` also writes `--visible-viewport-height` and `--visible-viewport-top` from `window.visualViewport` so Android browser chrome does not cover the game header.

## Where To Change Spacing

Common page spacing:

- `styles/common.css` `--page-gutter`
- `styles/common.css` `--page-padding-block`
- `styles/common.css` `.shell`

Setup spacing:

- `styles/setup.css` `.setup-screen gap`
- `styles/setup.css` `.setup-copy padding`
- `styles/setup.css` `.setup-form gap`
- `styles/setup.css` `.player-grid gap`
- `styles/setup.css` `.player-panel padding` and `gap`

Game spacing:

- `styles/game.css` `.game-screen gap`
- `styles/game.css` `.toolbar gap`
- `styles/game.css` `.scoreboard gap`
- `styles/game.css` `.reading-prompt padding` and `gap`
- `styles/game.css` `.overlay padding`
- `styles/game.css` `.mobile-controls gap`

## Where To Change Font Sizes

Shared text:

- `styles/common.css` `.eyebrow`
- `styles/common.css` `h1`, controlled by `--title-size`
- `styles/common.css` `h2`

Setup text:

- `styles/setup.css` `.lede`
- `styles/setup.css` `.mode-picker legend`, `.setting-picker legend`
- `styles/setup.css` `.field`
- `styles/setup.css` `kbd`

Game text:

- `styles/game.css` `.game-header h1`, controlled by `--game-title-size`
- `styles/game.css` `.score-value`
- `styles/game.css` `.reading-prompt span`
- `styles/game.css` `.reading-prompt strong`, controlled by `--target-word-size`
- `styles/game.css` `.overlay h2`

## UI JavaScript

`src/presentation/ui.js` should stay focused on DOM behavior:

- read setup form values
- populate the dictionary dropdown
- render keyboard hints from `src/config.js` `KEY_MAP`
- apply saved preferences
- toggle disabled setup states
- render scorecards and target words
- show and hide overlays
- force one-player setup and expose D-pad controls in phone mode
- measure board-fit constraints for auto-sized fields
- expose the CSS color palette to `src/presentation/renderer.js`

Game rules should stay in `src/core/engine.js`, and canvas drawing should stay in `src/presentation/renderer.js` and `src/core/dictionary.js`.
