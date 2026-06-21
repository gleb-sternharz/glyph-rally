(function (window) {
  "use strict";

  // Preferred visible cell size in CSS pixels; the renderer keeps the canvas sharp.
  const CELL_SIZE = 18;

  const FIELD_SIZES = {
    small: { cols: 30, rows: 21 },
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
    KeyW: { player: 0, dir: "up" },
    KeyA: { player: 0, dir: "left" },
    KeyS: { player: 0, dir: "down" },
    KeyD: { player: 0, dir: "right" },
    ArrowUp: { player: 1, dir: "up" },
    ArrowLeft: { player: 1, dir: "left" },
    ArrowDown: { player: 1, dir: "down" },
    ArrowRight: { player: 1, dir: "right" },
  };

  const DEFAULT_PLAYERS = [
    { name: "Lime", color: "#51d88a" },
    { name: "Berry", color: "#5aa7ff" },
  ];

  const SKULL_COUNT_BY_MODE = {
    1: 1,
    2: 2,
  };

  window.SnakeConfig = {
    CELL_SIZE,
    FIELD_SIZES,
    SPEEDS,
    DIRS,
    KEY_MAP,
    DEFAULT_PLAYERS,
    SKULL_COUNT_BY_MODE,
    STORAGE_KEY: "localSnakePrefs",
  };
})(window);
