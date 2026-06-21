# UI Design

The UI is split into shared, setup, and game styling:

- `common.css`: theme colors, design tokens, typography, global layout, shared buttons, focus states.
- `setup.css`: setup screen, player panels, radio/segmented controls, dictionary select, keyboard hints.
- `game.css`: game header, toolbar, scoreboard, reading prompt, canvas arena, overlay.

## Main Design Tokens

Most high-level knobs are defined in `common.css` under `:root`:

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

Theme color tokens are also in `common.css`. The dark theme is `:root`; the light theme overrides values in `:root[data-theme="light"]`.

## Where To Change Layout

Setup screen layout:

- `setup.css` `.setup-screen`: two-column desktop layout.
- `setup.css` `.setup-form`: vertical spacing between form sections.
- `setup.css` `.settings-grid`: challenge, speed, field size, dictionary, and theme grid.
- `setup.css` media queries at `840px` and `520px`: tablet and mobile layout changes.

Game screen layout:

- `game.css` `.game-screen`: spacing between header, scoreboard, prompt, and arena.
- `game.css` `.game-header`: title and toolbar alignment.
- `game.css` `.scoreboard`: one or two score columns.
- `game.css` `.reading-prompt`: target-word panel width and spacing.
- `game.css` `.arena-wrap`: canvas frame and aspect ratio.

Canvas board size:

- `config.js` `CELL_SIZE` sets preferred cell size.
- `config.js` `FIELD_SIZES` sets board columns and rows.
- `renderer.js` sets `--arena-preferred-width` at runtime so the reading prompt aligns with the arena.

## Where To Change Spacing

Common page spacing:

- `common.css` `--page-gutter`
- `common.css` `--page-padding-block`
- `common.css` `.shell`

Setup spacing:

- `setup.css` `.setup-screen gap`
- `setup.css` `.setup-copy padding`
- `setup.css` `.setup-form gap`
- `setup.css` `.player-grid gap`
- `setup.css` `.player-panel padding` and `gap`

Game spacing:

- `game.css` `.game-screen gap`
- `game.css` `.toolbar gap`
- `game.css` `.scoreboard gap`
- `game.css` `.reading-prompt padding` and `gap`
- `game.css` `.overlay padding`

## Where To Change Font Sizes

Shared text:

- `common.css` `.eyebrow`
- `common.css` `h1`, controlled by `--title-size`
- `common.css` `h2`

Setup text:

- `setup.css` `.lede`
- `setup.css` `.mode-picker legend`, `.setting-picker legend`
- `setup.css` `.field`
- `setup.css` `kbd`

Game text:

- `game.css` `.game-header h1`, controlled by `--game-title-size`
- `game.css` `.score-value`
- `game.css` `.reading-prompt span`
- `game.css` `.reading-prompt strong`, controlled by `--target-word-size`
- `game.css` `.overlay h2`

## UI JavaScript

`ui.js` should stay focused on DOM behavior:

- read setup form values
- populate the dictionary dropdown
- render keyboard hints from `config.js` `KEY_MAP`
- apply saved preferences
- toggle disabled setup states
- render scorecards and target words
- show and hide overlays
- expose the CSS color palette to `renderer.js`

Game rules should stay in `engine.js`, and canvas drawing should stay in `renderer.js` and `dictionary.js`.
