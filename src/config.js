(function (window) {
  "use strict";

  // Preferred visible cell size in CSS pixels; the renderer keeps the canvas sharp.
  const CELL_SIZE = 32;
  const DEFAULT_FIELD_SIZE = "auto";

  const FIELD_SIZES = {
    auto: {
      auto: true,
      minCols: 12,
      minRows: 10,
      maxCols: 42,
      maxRows: 32,
      minCell: 16,
      maxCell: CELL_SIZE,
      targetCell: 28,
      phoneTargetCell: 22,
    },
    small: { cols: 40, rows: 20 },
    medium: { cols: 40, rows: 28 },
    large: { cols: 50, rows: 35 },
  };

  const SPEEDS = {
    manual: {
      auto: false,
      onePlayerTick: 0,
      twoPlayerTick: 0,
      minTick: 0,
      acceleration: 0,
    },
    slow: {
      auto: true,
      onePlayerTick: 190,
      twoPlayerTick: 210,
      minTick: 145,
      acceleration: 0.6,
    },
    fast: {
      auto: true,
      onePlayerTick: 112,
      twoPlayerTick: 126,
      minTick: 74,
      acceleration: 1.2,
    },
  };

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const KEY_MAP = {
    ArrowUp: { player: 0, dir: "up" },
    ArrowLeft: { player: 0, dir: "left" },
    ArrowDown: { player: 0, dir: "down" },
    ArrowRight: { player: 0, dir: "right" },
    KeyW: { player: 1, dir: "up" },
    KeyA: { player: 1, dir: "left" },
    KeyS: { player: 1, dir: "down" },
    KeyD: { player: 1, dir: "right" },
  };

  const DEFAULT_PLAYERS = [
    { name: "Lime", color: "#51d88a" },
    { name: "Berry", color: "#5aa7ff" },
  ];

  const GAME_TYPES = {
    classic: "classic",
    reading: "reading",
  };

  const CLASSIC_ITEM_COUNTS_BY_MODE = {
    1: { apple: 2, skull: 1 },
    2: { apple: 3, skull: 2 },
  };

  const READING_SYMBOL_COUNT_BY_MODE = {
    1: 4,
    2: 6,
  };

  const DEFAULT_DICTIONARY_ID = "english";

  const DICTIONARIES = [
    { id: "english", label: "English", source: "english" },
    { id: "french", label: "Français", source: "french" },
    { id: "german", label: "Deutsch", source: "german" },
    { id: "greek", label: "Ελληνικά", source: "greek" },
    { id: "russian", label: "Русский", source: "russian" },
  ];

  window.SnakeConfig = {
    CELL_SIZE,
    FIELD_SIZES,
    SPEEDS,
    DIRS,
    KEY_MAP,
    DEFAULT_PLAYERS,
    DEFAULT_FIELD_SIZE,
    CLASSIC_ITEM_COUNTS_BY_MODE,
    DEFAULT_DICTIONARY_ID,
    DICTIONARIES,
    GAME_TYPES,
    READING_SYMBOL_COUNT_BY_MODE,
    STORAGE_KEY: "localSnakePrefs",
  };
})(window);
