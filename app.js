(function (window) {
  "use strict";

  const { KEY_MAP } = window.SnakeConfig;
  const engine = window.SnakeEngine;
  const storage = window.SnakeStorage;
  const ui = window.SnakeUI.createUi();
  const sound = window.SnakeSound.createSound();
  const renderer = window.SnakeRenderer.createRenderer(ui.elements.canvas);

  const runtime = {
    running: false,
    paused: false,
    over: false,
    lastTime: 0,
    accumulator: 0,
    animationId: 0,
  };
  let game = null;

  function startGame(settings) {
    sound.unlock();
    stopLoop();
    storage.savePrefs(settings);
    ui.applyTheme(settings.theme);

    game = engine.createGame(settings);
    renderer.resize(game.board);
    resetRuntime();
    ui.resetPauseButton();
    ui.showGameScreen();
    ui.hideOverlay();
    ui.renderScoreboard(game.players);
    ui.renderTarget(game);
    draw();

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

  function syncSetupPreview() {
    ui.updateSetupState();
    const board = engine.createBoard(ui.readSettings().fieldSize);
    renderer.resize(board);
    renderer.drawBoard(board, ui.getPalette());
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
    ui.hideOverlay();
    ui.renderTarget(null);
    syncSetupPreview();
  });

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
    sound.unlock();
    if (binding.player < game.mode) {
      const accepted = engine.setDirection(game, binding.player, binding.dir);
      if (accepted) {
        advanceManualStep(binding.player);
      }
    }
  });

  ui.applyPrefs(storage.loadPrefs());
  syncSetupPreview();

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
})(window);
