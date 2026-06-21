(function (window) {
  "use strict";

  const { FIELD_SIZES, GAME_TYPES, SPEEDS, STORAGE_KEY } = window.SnakeConfig;

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      return normalizePrefs(JSON.parse(raw));
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage failures on file:// pages.
      }
      return null;
    }
  }

  function savePrefs(settings) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: settings.mode,
          challenge: settings.challenge,
          speed: settings.speed,
          fieldSize: settings.fieldSize,
          theme: settings.theme,
          players: settings.players.map(({ name, color }) => ({ name, color })),
        }),
      );
    } catch {
      // Storage can be blocked for file:// pages; the game should still launch.
    }
  }

  function normalizePrefs(prefs) {
    if (!prefs || typeof prefs !== "object") {
      return null;
    }

    const normalized = {};
    if (prefs.mode === 1 || prefs.mode === 2) {
      normalized.mode = prefs.mode;
    }
    if (prefs.challenge && GAME_TYPES[prefs.challenge]) {
      normalized.challenge = prefs.challenge;
    }
    if (prefs.speed && SPEEDS[prefs.speed]) {
      normalized.speed = prefs.speed;
    }
    if (prefs.fieldSize && FIELD_SIZES[prefs.fieldSize]) {
      normalized.fieldSize = prefs.fieldSize;
    }
    if (prefs.theme === "dark" || prefs.theme === "light") {
      normalized.theme = prefs.theme;
    }
    if (Array.isArray(prefs.players)) {
      normalized.players = prefs.players.slice(0, 2).map(normalizePlayer).filter(Boolean);
    }

    return normalized;
  }

  function normalizePlayer(player) {
    if (!player || typeof player !== "object") {
      return null;
    }

    const normalized = {};
    if (typeof player.name === "string") {
      normalized.name = player.name.slice(0, 16);
    }
    if (typeof player.color === "string" && /^#[0-9a-f]{6}$/i.test(player.color)) {
      normalized.color = player.color;
    }

    return normalized;
  }

  window.SnakeStorage = {
    loadPrefs,
    savePrefs,
  };
})(window);
