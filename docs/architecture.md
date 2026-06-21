# Architecture

This is a standalone browser game. It has no build step, no external packages, and runs by opening `index.html` directly.

## Runtime Flow

`index.html` loads `boot.js`. The boot script then loads the runtime files in dependency order:

1. `config.js` defines global constants and selectable options.
2. `boot.js` loads `dictionaries/*.js` from `SnakeConfig.DICTIONARIES`.
3. `dictionary.js` normalizes dictionary data and loads SVG icon images.
4. `storage.js` reads and writes local preferences.
5. `url-state.js` reads and writes shareable URL settings.
6. `engine.js` owns game state and game rules.
7. `renderer.js` draws the board, items, and snakes on the canvas.
8. `ui.js` owns DOM reads, DOM writes, theme state, and screen state.
9. `sound.js` owns the Web Audio sound effects.
10. `app.js` wires input, animation, rendering, sound, and game lifecycle.

The files attach their APIs to `window.SnakeConfig`, `window.SnakeDictionary`, `window.SnakeStorage`, `window.SnakeUrlState`, `window.SnakeEngine`, `window.SnakeRenderer`, `window.SnakeUI`, and `window.SnakeSound`.

## Main Boundaries

`engine.js` is the model and rules layer. It creates games, moves snakes, resolves collisions, handles item effects, and decides when the game is over. It does not touch DOM or canvas APIs.

`renderer.js` is the canvas layer. It receives a game object and a palette from the UI, then draws the board, item SVGs, snake bodies, and snake eyes.

`ui.js` is the DOM layer. It reads setup form values, renders scoreboard and target words, controls overlays, applies themes, and exposes CSS palette values to the renderer.

`sound.js` is the audio layer. It uses the Web Audio API to play generated effects for good hits, bad hits, and game over. It has no gameplay decisions.

`app.js` is the coordinator. It starts games, runs the animation loop, handles keyboard and button events, and asks the engine, UI, renderer, and storage modules to do their jobs.

`dictionary.js` is a small asset/data runtime. It parses configured dictionary data, normalizes words to uppercase, creates internal `matchKey` values from icon paths, and draws SVG icons on the canvas.

`url-state.js` is the share-link layer. It translates setup settings to and from query parameters. URL settings override local preferences during startup, and `app.js` keeps the current setup reflected in the address bar.

## Dictionary Loading

The project uses plain JavaScript dictionary files instead of JSON files. This keeps the game runnable from `file://` without `fetch()`, `XMLHttpRequest`, modules, or a local server.

Each `dictionaries/*.js` file adds entries to `window.SnakeDictionarySources`, and `dictionary.js` consumes the configured sources directly.

Native ES module `import` is intentionally not used because browser module loading is not reliable when opening this project directly through `file://`.
