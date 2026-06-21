# Configuration

Most gameplay settings live in `config.js`. Setup-screen styling lives in CSS, while the selected user preferences are stored in browser `localStorage`.

## Gameplay Config

Edit `config.js` for:

- `CELL_SIZE`: preferred visible cell size in CSS pixels. The renderer keeps the canvas sharp at device pixel ratio.
- `FIELD_SIZES`: named board sizes used by the setup field-size picker.
- `SPEEDS`: manual, slow, and fast timing. `auto: false` means a snake moves only after its own direction key input.
- `KEY_MAP`: keyboard bindings for each player. The movement handler and the visible setup-screen key hints both read this map.
- `DEFAULT_PLAYERS`: default names and colors in the setup form.
- `CLASSIC_ITEM_COUNTS_BY_MODE`: apple and skull counts for one-player and two-player classic mode.
- `READING_SYMBOL_COUNT_BY_MODE`: number of symbols shown in reading mode.
- `DICTIONARIES`: dropdown options. Each option has `id`, `label`, and `source`.

## Dictionaries

Dictionary files live in `dictionaries/`. Each file is a JavaScript file that registers a direct object array on `window.SnakeDictionarySources`:

```js
(function (window) {
  "use strict";

  window.SnakeDictionarySources = window.SnakeDictionarySources || {};
  window.SnakeDictionarySources.english = [
    { word: "APPLE", icon: "icons/apple.svg" },
    { word: "CAR", icon: "icons/car.svg" },
  ];
})(window);
```

Dictionary entries intentionally do not contain ids. At runtime, `dictionary.js` derives an internal `matchKey` from the icon path.

Keep icon paths unique inside a dictionary. Reading mode uses the icon path to decide which rendered symbol matches the target word.

After adding a new dictionary file, add an option to `DICTIONARIES` in `config.js` using the same `source` key. `boot.js` automatically loads `dictionaries/<source>.js`.

## Icons

Icons live in `icons/` as SVG files. A dictionary entry points to an SVG with a relative path such as `icons/apple.svg`.

Classic mode also uses SVGs:

- Apple: `icons/apple.svg`
- Skull: `icons/skull.svg`

## Preferences

`storage.js` saves these settings:

- player count
- challenge mode
- dictionary id
- speed
- field size
- theme
- player names and colors

The storage key is `localSnakePrefs`, configured in `config.js`.

## Shareable URLs

`url-state.js` keeps the address bar synchronized with the setup form. A copied URL can restore a specific game setup on another browser:

```text
index.html?mode=2&challenge=reading&dictionary=greek&speed=slow&field=large&theme=light&p1=Alex&c1=51d88a&p2=Mira&c2=5aa7ff
```

Supported query parameters:

- `mode`: `1` or `2`
- `challenge`: `classic` or `reading`
- `dictionary`: any configured dictionary id
- `speed`: any key from `SPEEDS`
- `field`: any key from `FIELD_SIZES`
- `theme`: `dark` or `light`
- `p1`, `p2`: player names
- `c1`, `c2`: player colors as six-digit hex values, without `#`

On startup, URL settings are applied after localStorage preferences, so a shared link wins over saved local choices.
