(function (window) {
  "use strict";

  const { DEFAULT_PLAYERS, FIELD_SIZES, GAME_TYPES, SPEEDS } = window.SnakeConfig;

  function createUi() {
    const elements = {
      canvas: document.querySelector("#gameCanvas"),
      setupScreen: document.querySelector("#setupScreen"),
      gameScreen: document.querySelector("#gameScreen"),
      setupForm: document.querySelector("#setupForm"),
      playerTwoPanel: document.querySelector("#playerTwoPanel"),
      scoreboard: document.querySelector("#scoreboard"),
      pauseButton: document.querySelector("#pauseButton"),
      restartButton: document.querySelector("#restartButton"),
      setupButton: document.querySelector("#setupButton"),
      overlay: document.querySelector("#overlay"),
      overlayKicker: document.querySelector("#overlayKicker"),
      overlayTitle: document.querySelector("#overlayTitle"),
      overlayText: document.querySelector("#overlayText"),
      overlayButton: document.querySelector("#overlayButton"),
      readingPrompt: document.querySelector("#readingPrompt"),
      targetWord: document.querySelector("#targetWord"),
    };
    const playerMarks = elements.setupScreen.querySelectorAll(".player-mark");

    function applyPrefs(prefs) {
      if (!prefs) {
        return;
      }

      if (prefs.mode) {
        elements.setupForm.elements.mode.value = String(prefs.mode);
      }
      if (prefs.challenge) {
        elements.setupForm.elements.challenge.value = prefs.challenge;
      }
      if (prefs.speed) {
        elements.setupForm.elements.speed.value = prefs.speed;
      }
      if (prefs.fieldSize) {
        elements.setupForm.elements.fieldSize.value = prefs.fieldSize;
      }
      if (prefs.theme) {
        elements.setupForm.elements.theme.value = prefs.theme;
      }

      prefs.players?.forEach((player, index) => {
        const nameInput = elements.setupForm.elements[index === 0 ? "playerOneName" : "playerTwoName"];
        const colorInput = elements.setupForm.elements[index === 0 ? "playerOneColor" : "playerTwoColor"];
        if (nameInput && typeof player.name === "string") {
          nameInput.value = player.name;
        }
        if (colorInput && player.color) {
          colorInput.value = player.color;
        }
      });
    }

    function updateSetupState() {
      const mode = Number(elements.setupForm.elements.mode.value);
      const p1Color = elements.setupForm.elements.playerOneColor.value;
      const p2Color = elements.setupForm.elements.playerTwoColor.value;

      applyTheme(elements.setupForm.elements.theme.value);
      elements.playerTwoPanel.classList.toggle("is-disabled", mode === 1);
      elements.setupForm.elements.playerTwoName.disabled = mode === 1;
      elements.setupForm.elements.playerTwoColor.disabled = mode === 1;
      playerMarks[0].style.setProperty("--snake-color", p1Color);
      playerMarks[1].style.setProperty("--snake-color", p2Color);
    }

    function readSettings() {
      const mode = Number(elements.setupForm.elements.mode.value) === 1 ? 1 : 2;
      const challenge = GAME_TYPES[elements.setupForm.elements.challenge.value]
        ? elements.setupForm.elements.challenge.value
        : GAME_TYPES.classic;
      const firstName = sanitizeName(
        elements.setupForm.elements.playerOneName.value,
        DEFAULT_PLAYERS[0].name,
      );
      const secondName = sanitizeName(
        elements.setupForm.elements.playerTwoName.value,
        DEFAULT_PLAYERS[1].name,
      );
      const speed = SPEEDS[elements.setupForm.elements.speed.value]
        ? elements.setupForm.elements.speed.value
        : "fast";
      const fieldSize = FIELD_SIZES[elements.setupForm.elements.fieldSize.value]
        ? elements.setupForm.elements.fieldSize.value
        : "medium";
      const theme = elements.setupForm.elements.theme.value === "light" ? "light" : "dark";

      return {
        mode,
        challenge,
        speed,
        fieldSize,
        theme,
        players: [
          {
            name: firstName,
            color: elements.setupForm.elements.playerOneColor.value,
          },
          {
            name: secondName,
            color: elements.setupForm.elements.playerTwoColor.value,
          },
        ].slice(0, mode),
      };
    }

    function renderScoreboard(players) {
      elements.scoreboard.innerHTML = "";

      for (const player of players) {
        const card = document.createElement("article");
        card.className = "score-card";

        const name = document.createElement("div");
        name.className = "score-name";

        const marker = document.createElement("span");
        marker.className = "player-mark";
        marker.style.setProperty("--snake-color", player.color);

        const label = document.createElement("span");
        label.textContent = player.name;

        const score = document.createElement("div");
        score.className = "score-value";
        score.textContent = player.score;

        name.append(marker, label);
        card.append(name, score);
        elements.scoreboard.append(card);
      }
    }

    function renderTarget(game) {
      if (game?.challenge === GAME_TYPES.reading && game.targetEntry) {
        elements.targetWord.textContent = game.targetEntry.word;
        elements.readingPrompt.classList.remove("is-hidden");
        return;
      }

      elements.readingPrompt.classList.add("is-hidden");
    }

    function formatGameResult(result) {
      if (result.type === "solo") {
        return {
          kicker: "Final",
          title: "Game over",
          text: `${result.player.name} scored ${result.score}.`,
        };
      }
      if (result.type === "survivor") {
        return {
          kicker: "Final",
          title: `${result.winner.name} wins`,
          text: `${result.score} point${result.score === 1 ? "" : "s"} and still standing.`,
        };
      }
      if (result.type === "score") {
        return {
          kicker: "Final",
          title: `${result.winner.name} wins`,
          text: `${result.score} point${result.score === 1 ? "" : "s"} takes it.`,
        };
      }

      return {
        kicker: "Final",
        title: "Draw",
        text: `${result.score} point${result.score === 1 ? "" : "s"} each.`,
      };
    }

    function showOverlay({ kicker, title, text, buttonLabel, onClick }) {
      elements.overlayKicker.textContent = kicker;
      elements.overlayTitle.textContent = title;
      elements.overlayText.textContent = text;
      elements.overlayButton.textContent = buttonLabel;
      elements.overlayButton.onclick = onClick;
      elements.overlay.classList.remove("is-hidden");
    }

    function hideOverlay() {
      elements.overlay.classList.add("is-hidden");
      elements.overlayButton.onclick = null;
    }

    function showGameScreen() {
      elements.setupScreen.classList.add("is-hidden");
      elements.gameScreen.classList.remove("is-hidden");
    }

    function showSetupScreen() {
      elements.gameScreen.classList.add("is-hidden");
      elements.setupScreen.classList.remove("is-hidden");
    }

    function applyTheme(theme) {
      document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
    }

    function resetPauseButton() {
      elements.pauseButton.setAttribute("aria-label", "Pause");
      elements.pauseButton.firstElementChild.textContent = "||";
    }

    function setPauseButtonPaused(paused) {
      elements.pauseButton.setAttribute("aria-label", paused ? "Resume" : "Pause");
      elements.pauseButton.firstElementChild.textContent = paused ? "\u25b6" : "||";
    }

    function getPalette() {
      const rootStyle = getComputedStyle(document.documentElement);
      return {
        canvasBg: cssVar(rootStyle, "--canvas-bg"),
        canvasGrid: cssVar(rootStyle, "--canvas-grid"),
        canvasBorder: cssVar(rootStyle, "--canvas-border"),
        deadSnake: cssVar(rootStyle, "--dead-snake"),
        eye: cssVar(rootStyle, "--eye"),
        deadEye: cssVar(rootStyle, "--dead-eye"),
        skull: cssVar(rootStyle, "--skull"),
        skullDetail: cssVar(rootStyle, "--skull-detail"),
        food: cssVar(rootStyle, "--accent"),
        foodHighlight: "rgba(255, 255, 255, 0.45)",
      };
    }

    return {
      elements,
      applyPrefs,
      applyTheme,
      formatGameResult,
      getPalette,
      hideOverlay,
      readSettings,
      renderScoreboard,
      renderTarget,
      resetPauseButton,
      setPauseButtonPaused,
      showGameScreen,
      showOverlay,
      showSetupScreen,
      updateSetupState,
    };
  }

  function sanitizeName(value, fallback) {
    const trimmed = value.trim().replace(/\s+/g, " ");
    return trimmed || fallback;
  }

  function cssVar(rootStyle, name) {
    return rootStyle.getPropertyValue(name).trim();
  }

  function isTypingTarget(target) {
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable
    );
  }

  window.SnakeUI = {
    createUi,
    isTypingTarget,
  };
})(window);
