(function (window) {
  "use strict";

  const { DICTIONARIES, FIELD_SIZES, GAME_TYPES, SPEEDS } = window.SnakeConfig;

  const SETTING_PARAMS = [
    "mode",
    "challenge",
    "dictionary",
    "dictionaryId",
    "speed",
    "field",
    "fieldSize",
    "theme",
    "p1",
    "p2",
    "c1",
    "c2",
  ];

  function readSettings() {
    const params = new URLSearchParams(window.location.search);
    if (!SETTING_PARAMS.some((name) => params.has(name))) {
      return null;
    }

    const prefs = {};
    const mode = parseMode(params.get("mode"));
    if (mode) {
      prefs.mode = mode;
    }

    const challenge = params.get("challenge");
    if (challenge && GAME_TYPES[challenge]) {
      prefs.challenge = challenge;
    }

    const dictionaryId = params.get("dictionary") || params.get("dictionaryId");
    if (dictionaryId && isDictionaryId(dictionaryId)) {
      prefs.dictionaryId = dictionaryId;
    }

    const speed = params.get("speed");
    if (speed && SPEEDS[speed]) {
      prefs.speed = speed;
    }

    const fieldSize = params.get("field") || params.get("fieldSize");
    if (fieldSize && FIELD_SIZES[fieldSize]) {
      prefs.fieldSize = fieldSize;
    }

    const theme = params.get("theme");
    if (theme === "dark" || theme === "light") {
      prefs.theme = theme;
    }

    const players = [
      normalizePlayer(params.get("p1"), params.get("c1")),
      normalizePlayer(params.get("p2"), params.get("c2")),
    ].filter(Boolean);

    if (players.length) {
      prefs.players = players;
    }

    return Object.keys(prefs).length ? prefs : null;
  }

  function writeSettings(settings) {
    if (!settings || !window.history?.replaceState) {
      return;
    }

    const url = new URL(window.location.href);
    for (const name of SETTING_PARAMS) {
      url.searchParams.delete(name);
    }

    url.searchParams.set("mode", String(settings.mode));
    url.searchParams.set("challenge", settings.challenge);
    url.searchParams.set("dictionary", settings.dictionaryId);
    url.searchParams.set("speed", settings.speed);
    url.searchParams.set("field", settings.fieldSize);
    url.searchParams.set("theme", settings.theme);

    settings.players.forEach((player, index) => {
      const playerNumber = index + 1;
      url.searchParams.set(`p${playerNumber}`, player.name);
      url.searchParams.set(`c${playerNumber}`, stripColorHash(player.color));
    });

    window.history.replaceState(null, document.title, url.toString());
  }

  function parseMode(value) {
    const mode = Number(value);
    return mode === 1 || mode === 2 ? mode : null;
  }

  function normalizePlayer(name, color) {
    const normalized = {};

    if (typeof name === "string" && name.trim()) {
      normalized.name = name.trim().replace(/\s+/g, " ").slice(0, 16);
    }

    const normalizedColor = normalizeColor(color);
    if (normalizedColor) {
      normalized.color = normalizedColor;
    }

    return Object.keys(normalized).length ? normalized : null;
  }

  function normalizeColor(value) {
    if (typeof value !== "string") {
      return null;
    }

    const hex = value.trim().replace(/^#/, "");
    return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}` : null;
  }

  function stripColorHash(color) {
    return typeof color === "string" ? color.replace(/^#/, "") : "";
  }

  function isDictionaryId(id) {
    return DICTIONARIES.some((dictionary) => dictionary.id === id);
  }

  window.SnakeUrlState = {
    readSettings,
    writeSettings,
  };
})(window);
