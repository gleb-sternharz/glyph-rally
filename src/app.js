(function (window) {
  "use strict";

  const { KEY_MAP } = window.SnakeConfig;
  const engine = window.SnakeEngine;
  const storage = window.SnakeStorage;
  const urlState = window.SnakeUrlState;
  const ui = window.SnakeUI.createUi();
  const sound = window.SnakeSound.createSound();
  const renderer = window.SnakeRenderer.createRenderer(ui.elements.canvas);
  const phoneQuery = window.matchMedia?.("(pointer: coarse) and (max-width: 700px)");
  const narrowQuery = window.matchMedia?.("(max-width: 700px)");

  const runtime = {
    running: false,
    paused: false,
    over: false,
    lastTime: 0,
    accumulator: 0,
    animationId: 0,
  };
  let game = null;
  let resizeFrame = 0;
  let swipeStart = null;

  function startGame(settings) {
    sound.unlock();
    stopLoop();
    storage.savePrefs(settings);
    urlState.writeSettings(settings);
    ui.applyTheme(settings.theme);

    game = engine.createGame(settings);
    resetRuntime();
    ui.resetPauseButton();
    ui.hideOverlay();
    ui.renderScoreboard(game.players);
    ui.renderTarget(game);
    ui.showGameScreen();
    ui.scrollToTop();
    ui.syncViewportMetrics();
    renderer.resize(game.board);
    draw();
    scheduleSettledViewportSync();

    runtime.animationId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    runtime.running = false;
    cancelAnimationFrame(runtime.animationId);
  }

  function resetRuntime() {
    runtime.running = true;
    runtime.paused = false;
    runtime.over = false;
    runtime.lastTime = 0;
    runtime.accumulator = 0;
  }

  function loop(timestamp) {
    if (!runtime.running || !game) {
      return;
    }

    if (!runtime.lastTime) {
      runtime.lastTime = timestamp;
    }

    const delta = timestamp - runtime.lastTime;
    runtime.lastTime = timestamp;

    if (engine.isAutoSpeed(game) && !runtime.paused && !runtime.over) {
      runtime.accumulator += delta;
      while (runtime.accumulator >= game.tickMs) {
        stepGame();
        runtime.accumulator -= game.tickMs;
      }
    }

    draw();
    runtime.animationId = requestAnimationFrame(loop);
  }

  function stepGame(options) {
    if (!game || runtime.over) {
      return;
    }

    const events = engine.updateGame(game, options);
    playStepSounds(events);
    if (events.scoreChanged) {
      ui.renderScoreboard(game.players);
    }
    if (events.targetChanged) {
      ui.renderTarget(game);
    }
    if (events.gameOver) {
      finishGame();
    }
  }

  function finishGame() {
    runtime.over = true;
    runtime.paused = false;
    sound.gameOver();
    ui.setPauseButtonPaused(false);
    ui.renderScoreboard(game.players);

    const message = ui.formatGameResult(engine.getResult(game));
    ui.showOverlay({
      ...message,
      buttonLabel: "Play again",
      onClick: () => startGame(ui.readSettings()),
    });
  }

  function draw() {
    if (game) {
      renderer.draw(game, ui.getPalette());
    }
  }

  function resizeGameBoard() {
    if (!game) {
      return;
    }

    const settings = ui.readSettings();
    const boardFit = game.fieldSize === "auto"
      ? { ...settings.boardFit, preserveBoard: game.board }
      : settings.boardFit;
    game.board = engine.createBoard(game.fieldSize, boardFit);
    renderer.resize(game.board);
    draw();
  }

  function togglePause() {
    if (!runtime.running || runtime.over) {
      return;
    }

    runtime.paused = !runtime.paused;
    ui.setPauseButtonPaused(runtime.paused);

    if (runtime.paused) {
      ui.showOverlay({
        kicker: "Paused",
        title: "Game paused",
        text: "Press resume when you are ready.",
        buttonLabel: "Resume",
        onClick: togglePause,
      });
    } else {
      ui.hideOverlay();
    }
  }

  function advanceManualStep(playerIndex) {
    if (!game || game.speed !== "manual" || runtime.paused || runtime.over) {
      return;
    }

    stepGame({ playerIndex });
    draw();
  }

  function applyDirection(playerIndex, dir) {
    if (!game || runtime.over || playerIndex >= game.mode) {
      return;
    }

    sound.unlock();
    if (engine.setDirection(game, playerIndex, dir)) {
      advanceManualStep(playerIndex);
    }
  }

  function syncSetupPreview() {
    ui.updateSetupState();
    const settings = ui.readSettings();
    urlState.writeSettings(settings);
    const board = engine.createBoard(settings.fieldSize, settings.boardFit);
    renderer.resize(board);
    renderer.drawBoard(board, ui.getPalette());
  }

  function syncViewportState() {
    const phoneMode = isPhoneViewport();
    ui.setPhoneMode(phoneMode);

    if (!game) {
      syncSetupPreview();
      return;
    }

    if (phoneMode && game.mode !== 1) {
      startGame(ui.readSettings());
      return;
    }

    resizeGameBoard();
  }

  function scheduleViewportSync() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(syncViewportState);
  }

  function scheduleSettledViewportSync() {
    scheduleViewportSync();
    requestAnimationFrame(() => {
      syncViewportState();
      requestAnimationFrame(syncViewportState);
    });
    window.setTimeout(syncViewportState, 120);
  }

  function isPhoneViewport() {
    const mobileUserAgent = /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent);
    return Boolean(
      phoneQuery?.matches ||
      (narrowQuery?.matches && (navigator.maxTouchPoints > 0 || mobileUserAgent))
    );
  }

  ui.elements.setupForm.addEventListener("input", syncSetupPreview);
  ui.elements.setupForm.addEventListener("change", syncSetupPreview);
  ui.elements.setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sound.unlock();
    startGame(ui.readSettings());
  });

  ui.elements.pauseButton.addEventListener("click", () => {
    sound.unlock();
    togglePause();
  });
  ui.elements.restartButton.addEventListener("click", () => {
    sound.unlock();
    startGame(ui.readSettings());
  });
  ui.elements.setupButton.addEventListener("click", () => {
    sound.unlock();
    stopLoop();
    game = null;
    ui.showSetupScreen();
    ui.scrollToTop();
    ui.hideOverlay();
    ui.renderTarget(null);
    syncSetupPreview();
  });

  for (const button of ui.elements.mobileControlButtons) {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      applyDirection(0, event.currentTarget.dataset.dir);
    });
  }

  ui.elements.arena.addEventListener("pointerdown", (event) => {
    if (
      !ui.isPhoneMode() ||
      !runtime.running ||
      runtime.paused ||
      runtime.over ||
      !game ||
      event.target.closest("button")
    ) {
      return;
    }

    swipeStart = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    ui.elements.arena.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });

  ui.elements.arena.addEventListener("pointermove", (event) => {
    if (!swipeStart || swipeStart.id !== event.pointerId) {
      return;
    }

    event.preventDefault();
  });

  ui.elements.arena.addEventListener("pointerup", finishSwipe);
  ui.elements.arena.addEventListener("pointercancel", finishSwipe);

  window.addEventListener("keydown", (event) => {
    if (window.SnakeUI.isTypingTarget(event.target) || !runtime.running || !game) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      sound.unlock();
      togglePause();
      return;
    }

    if (event.code === "Enter" && runtime.over) {
      event.preventDefault();
      sound.unlock();
      startGame(ui.readSettings());
      return;
    }

    const binding = KEY_MAP[event.code];
    if (!binding) {
      return;
    }

    event.preventDefault();
    applyDirection(binding.player, binding.dir);
  });

  if (phoneQuery?.addEventListener) {
    phoneQuery.addEventListener("change", scheduleViewportSync);
  } else if (phoneQuery?.addListener) {
    phoneQuery.addListener(scheduleViewportSync);
  }
  if (narrowQuery?.addEventListener) {
    narrowQuery.addEventListener("change", scheduleViewportSync);
  } else if (narrowQuery?.addListener) {
    narrowQuery.addListener(scheduleViewportSync);
  }

  window.addEventListener("resize", scheduleViewportSync);
  window.addEventListener("orientationchange", scheduleViewportSync);
  if (window.visualViewport?.addEventListener) {
    window.visualViewport.addEventListener("resize", scheduleViewportSync);
    window.visualViewport.addEventListener("scroll", scheduleViewportSync);
  }

  ui.setPhoneMode(isPhoneViewport());
  ui.applyPrefs(storage.loadPrefs());
  ui.applyPrefs(urlState.readSettings());
  ui.setPhoneMode(isPhoneViewport());
  syncSetupPreview();
  finishInitialRender();

  function finishSwipe(event) {
    if (!swipeStart || swipeStart.id !== event.pointerId) {
      return;
    }

    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    if (ui.elements.arena.hasPointerCapture?.(event.pointerId)) {
      ui.elements.arena.releasePointerCapture(event.pointerId);
    }
    swipeStart = null;
    event.preventDefault();

    if (distance < 24) {
      return;
    }

    applyDirection(0, Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? "right" : "left")
      : (dy > 0 ? "down" : "up"));
  }

  function playStepSounds(events) {
    if (events.gameOver) {
      return;
    }
    if (events.goodHit) {
      sound.goodHit();
    }
    if (events.badHit) {
      sound.badHit();
    }
  }

  async function finishInitialRender() {
    try {
      reportLoadingProgress(90, "Loading icons");
      await window.SnakeDictionary.preloadIcons(["assets/icons/skull.svg"]);

      reportLoadingProgress(96, "Rendering board");
      syncSetupPreview();
      await nextFrame();
      syncSetupPreview();
      await nextFrame();
    } finally {
      window.SnakeAppReady = true;
      window.dispatchEvent(new CustomEvent("snake:ready"));
    }
  }

  function reportLoadingProgress(progress, label) {
    window.dispatchEvent(new CustomEvent("snake:loading-progress", {
      detail: { progress, label },
    }));
  }

  function nextFrame() {
    return new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  }
})(window);
