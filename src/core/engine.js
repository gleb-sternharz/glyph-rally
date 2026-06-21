(function (window) {
  "use strict";

  const {
    CELL_SIZE,
    CLASSIC_ITEM_COUNTS_BY_MODE,
    DEFAULT_DICTIONARY_ID,
    DICTIONARIES,
    DIRS,
    FIELD_SIZES,
    GAME_TYPES,
    READING_SYMBOL_COUNT_BY_MODE,
    SPEEDS,
  } = window.SnakeConfig;

  const CLASSIC_ITEMS = {
    apple: {
      id: "classic-apple",
      itemType: "apple",
      icon: "assets/icons/apple.svg",
      word: "APPLE",
      effect: "grow",
      score: true,
    },
    skull: {
      id: "classic-skull",
      itemType: "skull",
      icon: "assets/icons/skull.svg",
      word: "SKULL",
      effect: "shrink",
      score: false,
    },
  };

  function createBoard(fieldSize) {
    const size = FIELD_SIZES[fieldSize] ?? FIELD_SIZES.medium;
    return {
      cols: size.cols,
      rows: size.rows,
      cell: CELL_SIZE,
    };
  }

  function createGame(settings) {
    const game = {
      mode: settings.mode,
      speed: settings.speed,
      fieldSize: settings.fieldSize,
      theme: settings.theme,
      dictionaryId: normalizeDictionaryId(settings.dictionaryId),
      challenge: GAME_TYPES[settings.challenge] ? settings.challenge : GAME_TYPES.classic,
      board: createBoard(settings.fieldSize),
      players: [],
      items: [],
      targetEntry: null,
      tickMs: getInitialTickMs(settings.speed, settings.mode),
    };

    game.players = settings.players.map((profile, index) => createPlayer(game, profile, index));
    setupItems(game);

    return game;
  }

  function updateGame(game, options = {}) {
    const events = {
      itemHit: false,
      badHit: false,
      goodHit: false,
      scoreChanged: false,
      targetChanged: false,
      gameOver: false,
      boardFilled: false,
    };
    const alivePlayers = game.players.filter((player) => player.alive);

    if (!alivePlayers.length) {
      events.gameOver = true;
      return events;
    }

    const movingPlayers = getMovingPlayers(game, alivePlayers, options.playerIndex);
    if (!movingPlayers.length) {
      return events;
    }

    const planned = planMoves(game, movingPlayers);
    const deaths = findDeaths(game, movingPlayers, alivePlayers, planned);
    applyDeaths(game, deaths);

    for (const player of movingPlayers) {
      if (!player.alive) {
        continue;
      }

      const nextHead = planned.get(player.index);
      player.body.unshift(nextHead);

      const item = takeItemAt(game, nextHead);
      const hitEffect = item ? resolveItemHit(game, player, item, events) : "none";
      trimTailAfterMove(player, hitEffect);
    }

    events.gameOver = events.boardFilled || isGameOver(game);
    return events;
  }

  function getMovingPlayers(game, alivePlayers, playerIndex) {
    if (isAutoSpeed(game) || playerIndex === undefined) {
      return alivePlayers;
    }

    return alivePlayers.filter((player) => player.index === playerIndex);
  }

  function setDirection(game, playerIndex, nextDirName) {
    const player = game.players[playerIndex];
    if (!player?.alive) {
      return false;
    }

    const current = DIRS[player.dir];
    const next = DIRS[nextDirName];
    if (!next || (current.x + next.x === 0 && current.y + next.y === 0)) {
      return false;
    }

    player.nextDir = nextDirName;
    return true;
  }

  function isAutoSpeed(game) {
    return Boolean((SPEEDS[game.speed] ?? SPEEDS.fast).auto);
  }

  function getResult(game) {
    const alive = game.players.filter((player) => player.alive);
    const topScore = Math.max(0, ...game.players.map((player) => player.score));
    const leaders = game.players.filter((player) => player.score === topScore);

    if (game.mode === 1) {
      return {
        type: "solo",
        player: game.players[0],
        score: game.players[0]?.score ?? 0,
      };
    }
    if (alive.length === 1) {
      return {
        type: "survivor",
        winner: alive[0],
        score: alive[0].score,
      };
    }
    if (leaders.length === 1) {
      return {
        type: "score",
        winner: leaders[0],
        score: leaders[0].score,
      };
    }

    return {
      type: "draw",
      score: topScore,
    };
  }

  function createPlayer(game, profile, index) {
    const start = createStart(game, index);
    return {
      ...profile,
      index,
      body: start.body.map((segment) => ({ ...segment })),
      dir: start.dir,
      nextDir: start.dir,
      score: 0,
      alive: true,
      pendingGrow: 0,
    };
  }

  function createStart(game, index) {
    const length = 4;
    const centerY = Math.floor(game.board.rows / 2);
    const yOffset = game.mode === 2 ? (index === 0 ? 1 : -1) : 0;
    const y = Math.max(1, Math.min(game.board.rows - 2, centerY + yOffset));

    if (index === 0) {
      const headX = Math.max(length, Math.floor(game.board.cols * 0.22));
      return {
        body: Array.from({ length }, (_, segmentIndex) => ({
          x: headX - segmentIndex,
          y,
        })),
        dir: "right",
      };
    }

    const headX = Math.min(game.board.cols - length - 1, Math.ceil(game.board.cols * 0.78));
    return {
      body: Array.from({ length }, (_, segmentIndex) => ({
        x: headX + segmentIndex,
        y,
      })),
      dir: "left",
    };
  }

  function planMoves(game, alivePlayers) {
    const planned = new Map();

    for (const player of alivePlayers) {
      player.dir = player.nextDir;
      const dir = DIRS[player.dir];
      planned.set(player.index, wrapCell(game.board, {
        x: player.body[0].x + dir.x,
        y: player.body[0].y + dir.y,
      }));
    }

    return planned;
  }

  function findDeaths(game, movingPlayers, alivePlayers, planned) {
    const deaths = new Set();

    for (const player of movingPlayers) {
      const head = planned.get(player.index);
      for (const rival of alivePlayers) {
        const canTrimTail = rival.index === player.index && rival.pendingGrow === 0;
        const segments = canTrimTail ? rival.body.slice(0, -1) : rival.body;
        if (segments.some((segment) => sameCell(head, segment))) {
          deaths.add(player.index);
        }
      }
    }

    if (game.mode === 2 && movingPlayers.length > 1) {
      addHeadCollisionDeaths(game, planned, deaths);
    }

    return deaths;
  }

  function addHeadCollisionDeaths(game, planned, deaths) {
    const p1Head = planned.get(0);
    const p2Head = planned.get(1);
    if (p1Head && p2Head && sameCell(p1Head, p2Head)) {
      deaths.add(0);
      deaths.add(1);
    }

    const playerOne = game.players[0];
    const playerTwo = game.players[1];
    if (
      p1Head &&
      p2Head &&
      playerOne?.alive &&
      playerTwo?.alive &&
      sameCell(p1Head, playerTwo.body[0]) &&
      sameCell(p2Head, playerOne.body[0])
    ) {
      deaths.add(0);
      deaths.add(1);
    }
  }

  function applyDeaths(game, deaths) {
    for (const player of game.players) {
      if (deaths.has(player.index)) {
        player.alive = false;
      }
    }
  }

  function setupItems(game) {
    game.items = [];
    game.targetEntry = null;

    if (game.challenge === GAME_TYPES.reading) {
      return startReadingRound(game);
    }

    return setupClassicItems(game);
  }

  function setupClassicItems(game) {
    const counts = CLASSIC_ITEM_COUNTS_BY_MODE[game.mode] ?? CLASSIC_ITEM_COUNTS_BY_MODE[1];
    let placedAll = true;

    for (const [kind, count] of Object.entries(counts)) {
      for (let index = 0; index < count; index += 1) {
        placedAll = placeItem(game, createClassicItem(kind)) && placedAll;
      }
    }

    return placedAll;
  }

  function createClassicItem(kind) {
    const item = CLASSIC_ITEMS[kind] ?? CLASSIC_ITEMS.apple;
    return { ...item, kind: "classic" };
  }

  function startReadingRound(game) {
    const entries = window.SnakeDictionary.getEntries(game.dictionaryId);
    const itemCount = Math.min(
      entries.length,
      READING_SYMBOL_COUNT_BY_MODE[game.mode] ?? READING_SYMBOL_COUNT_BY_MODE[1],
    );

    game.items = [];
    game.targetEntry = pickRandom(entries);

    if (!game.targetEntry || itemCount === 0) {
      return false;
    }

    const distractors = shuffle(entries.filter((entry) => entry.matchKey !== game.targetEntry.matchKey));
    const roundEntries = shuffle([game.targetEntry, ...distractors.slice(0, itemCount - 1)]);
    let placedAll = true;

    for (const entry of roundEntries) {
      placedAll = placeItem(game, {
        id: `reading-${entry.matchKey}`,
        kind: "reading",
        icon: entry.icon,
        word: entry.word,
        matchKey: entry.matchKey,
        effect: entry.matchKey === game.targetEntry.matchKey ? "grow" : "shrink",
        score: entry.matchKey === game.targetEntry.matchKey,
      }) && placedAll;
    }

    return placedAll;
  }

  function placeItem(game, item) {
    const occupied = new Set();
    for (const player of game.players) {
      for (const segment of player.body) {
        occupied.add(cellKey(segment));
      }
    }
    for (const existingItem of game.items) {
      occupied.add(cellKey(existingItem));
    }

    const freeCells = [];
    for (let y = 0; y < game.board.rows; y += 1) {
      for (let x = 0; x < game.board.cols; x += 1) {
        const key = `${x},${y}`;
        if (!occupied.has(key)) {
          freeCells.push({ x, y });
        }
      }
    }

    if (!freeCells.length) {
      return false;
    }

    game.items.push({
      ...item,
      ...freeCells[Math.floor(Math.random() * freeCells.length)],
    });
    return true;
  }

  function takeItemAt(game, cell) {
    const itemIndex = game.items.findIndex((item) => sameCell(item, cell));
    if (itemIndex < 0) {
      return null;
    }

    return game.items.splice(itemIndex, 1)[0];
  }

  function resolveItemHit(game, player, item, events) {
    events.itemHit = true;
    events.goodHit = events.goodHit || item.effect === "grow";
    events.badHit = events.badHit || item.effect === "shrink";

    if (item.effect === "grow") {
      player.score += 1;
      player.pendingGrow += 2;
      game.tickMs = getNextTickMs(game.speed, game.tickMs);
      events.scoreChanged = true;
    }

    if (game.challenge === GAME_TYPES.reading) {
      if (item.effect === "grow") {
        events.boardFilled = !startReadingRound(game);
        events.targetChanged = true;
      }
      return item.effect;
    }

    events.boardFilled = !placeItem(game, createClassicItem(item.itemType));
    return item.effect;
  }

  function trimTailAfterMove(player, effect) {
    let removals = 1;

    if (player.pendingGrow > 0) {
      player.pendingGrow -= 1;
      removals = effect === "shrink" ? 2 : 0;
    } else if (effect === "shrink") {
      removals = 2;
    }

    for (let index = 0; index < removals; index += 1) {
      player.body.pop();
    }

    if (player.body.length === 0) {
      player.alive = false;
    }
  }

  function isGameOver(game) {
    if (game.players.every((player) => !player.alive)) {
      return true;
    }

    return game.mode === 2 && game.players.filter((player) => player.alive).length === 1;
  }

  function getInitialTickMs(speed, mode) {
    const speedConfig = SPEEDS[speed] ?? SPEEDS.fast;
    return mode === 1 ? speedConfig.onePlayerTick : speedConfig.twoPlayerTick;
  }

  function getNextTickMs(speed, currentTickMs) {
    const speedConfig = SPEEDS[speed] ?? SPEEDS.fast;
    if (!speedConfig.auto) {
      return currentTickMs;
    }

    return Math.max(speedConfig.minTick, currentTickMs - speedConfig.acceleration);
  }

  function wrapCell(board, cell) {
    return {
      x: (cell.x + board.cols) % board.cols,
      y: (cell.y + board.rows) % board.rows,
    };
  }

  function sameCell(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function cellKey(cell) {
    return `${cell.x},${cell.y}`;
  }

  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }

    return copy;
  }

  function normalizeDictionaryId(dictionaryId) {
    return DICTIONARIES.some((dictionary) => dictionary.id === dictionaryId)
      ? dictionaryId
      : DEFAULT_DICTIONARY_ID;
  }

  window.SnakeEngine = {
    createBoard,
    createGame,
    getResult,
    isAutoSpeed,
    setDirection,
    updateGame,
  };
})(window);
