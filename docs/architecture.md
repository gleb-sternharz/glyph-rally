# Architecture

This is a standalone browser game. It has no build step, no external packages, and runs by opening `index.html` directly.

## Runtime Flow

`index.html` loads the scripts in dependency order:

1. `config.js` defines global constants and selectable options.
2. `dictionary-data.js` exposes the dictionary JSON text for `file://` use.
3. `dictionary.js` parses dictionary data and loads SVG icon images.
4. `storage.js` reads and writes local preferences.
5. `engine.js` owns game state and game rules.
6. `renderer.js` draws the board, items, and snakes on the canvas.
7. `ui.js` owns DOM reads, DOM writes, theme state, and screen state.
8. `app.js` wires input, animation, rendering, and game lifecycle.

The files attach their APIs to `window.SnakeConfig`, `window.SnakeDictionary`, `window.SnakeStorage`, `window.SnakeEngine`, `window.SnakeRenderer`, and `window.SnakeUI`.

## Main Boundaries

`engine.js` is the model and rules layer. It creates games, moves snakes, resolves collisions, handles item effects, and decides when the game is over. It does not touch DOM or canvas APIs.

`renderer.js` is the canvas layer. It receives a game object and a palette from the UI, then draws the board, item SVGs, snake bodies, and snake eyes.

`ui.js` is the DOM layer. It reads setup form values, renders scoreboard and target words, controls overlays, applies themes, and exposes CSS palette values to the renderer.

`app.js` is the coordinator. It starts games, runs the animation loop, handles keyboard and button events, and asks the engine, UI, renderer, and storage modules to do their jobs.

`dictionary.js` is a small asset/data runtime. It parses configured dictionary data, normalizes words to uppercase, creates internal `matchKey` values from icon paths, and draws SVG icons on the canvas.

## Local File Constraint

Browsers block `fetch()` and `XMLHttpRequest` for local JSON when `index.html` is opened through `file://`. The project keeps real JSON files in `dictionaries/`, but mirrors their text in `dictionary-data.js` so the game still works without a server.

If the app later moves behind a local server, `dictionary.js` can be changed to fetch the configured JSON paths directly and `dictionary-data.js` can be removed.
