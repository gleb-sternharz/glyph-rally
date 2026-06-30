(function (window) {
  "use strict";

  const {
    DEFAULT_DICTIONARY_ID,
    DEFAULT_FIELD_SIZE,
    DEFAULT_PLAYERS,
    DICTIONARIES,
    FIELD_SIZES,
    GAME_TYPES,
    KEY_MAP,
    PLAYER_COLORS,
    SPEEDS,
  } = window.SnakeConfig;
  const CONTROL_HINT_DIRECTIONS = ["up", "left", "down", "right"];

  function createUi() {
    const elements = {
      canvas: document.querySelector("#gameCanvas"),
      setupScreen: document.querySelector("#setupScreen"),
      gameScreen: document.querySelector("#gameScreen"),
      gameHeader: document.querySelector(".game-header"),
      arena: document.querySelector(".arena-wrap"),
      setupForm: document.querySelector("#setupForm"),
      modePicker: document.querySelector(".mode-picker"),
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
      dictionaryField: document.querySelector("#dictionaryField"),
      mobileControls: document.querySelector("#mobileControls"),
      mobileControlButtons: document.querySelectorAll("[data-dir]"),
    };
    const playerMarks = elements.setupScreen.querySelectorAll(".player-mark");
    const modeInputs = elements.setupForm.querySelectorAll('input[name="mode"]');
    let phoneMode = false;
    populateColorPickers();
    populateDictionarySelect();
    populateControlHints();

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
      if (prefs.fieldSize && elements.setupForm.elements.fieldSize) {
        elements.setupForm.elements.fieldSize.value = prefs.fieldSize;
      }
      if (prefs.theme) {
        elements.setupForm.elements.theme.value = prefs.theme;
      }
      if (prefs.dictionaryId && isDictionaryId(prefs.dictionaryId)) {
        elements.setupForm.elements.dictionaryId.value = prefs.dictionaryId;
      }

      prefs.players?.forEach((player, index) => {
        const nameInput = elements.setupForm.elements[index === 0 ? "playerOneName" : "playerTwoName"];
        if (nameInput && typeof player.name === "string") {
          nameInput.value = player.name;
        }
        if (player.color) {
          setPlayerColor(index, player.color);
        }
      });
    }

    function updateSetupState() {
      if (phoneMode) {
        elements.setupForm.elements.mode.value = "1";
      }

      const mode = phoneMode ? 1 : Number(elements.setupForm.elements.mode.value);
      const p1Color = readPlayerColor(0);
      const p2Color = readPlayerColor(1);
      const readingMode = elements.setupForm.elements.challenge.value === GAME_TYPES.reading;

      applyTheme(elements.setupForm.elements.theme.value);
      elements.modePicker.classList.toggle("is-disabled", phoneMode);
      for (const input of modeInputs) {
        input.disabled = phoneMode;
      }
      elements.playerTwoPanel.classList.toggle("is-disabled", mode === 1);
      elements.playerTwoPanel.classList.toggle("is-phone-hidden", phoneMode);
      elements.setupForm.elements.playerTwoName.disabled = mode === 1;
      setColorPickerDisabled(1, mode === 1);
      elements.setupForm.elements.dictionaryId.disabled = !readingMode;
      elements.dictionaryField.classList.toggle("is-disabled", !readingMode);
      playerMarks[0].style.setProperty("--snake-color", p1Color);
      playerMarks[1].style.setProperty("--snake-color", p2Color);
    }

    function readSettings() {
      const mode = phoneMode || Number(elements.setupForm.elements.mode.value) === 1 ? 1 : 2;
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
      const requestedFieldSize = elements.setupForm.elements.fieldSize?.value;
      const fieldSize = FIELD_SIZES[requestedFieldSize]
        ? requestedFieldSize
        : DEFAULT_FIELD_SIZE;
      const theme = elements.setupForm.elements.theme.value === "light" ? "light" : "dark";
      const dictionaryId = isDictionaryId(elements.setupForm.elements.dictionaryId.value)
        ? elements.setupForm.elements.dictionaryId.value
        : DEFAULT_DICTIONARY_ID;

      return {
        mode,
        challenge,
        dictionaryId,
        speed,
        fieldSize,
        boardFit: measureBoardFit(),
        theme,
        players: [
          {
            name: firstName,
            color: readPlayerColor(0),
          },
          {
            name: secondName,
            color: readPlayerColor(1),
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
        canvasChecker: cssVar(rootStyle, "--canvas-checker"),
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

    function setPhoneMode(nextPhoneMode) {
      phoneMode = Boolean(nextPhoneMode);
      document.documentElement.classList.toggle("is-phone-mode", phoneMode);
      elements.mobileControls.hidden = !phoneMode;
      elements.mobileControls.classList.toggle("is-hidden", !phoneMode);
      syncViewportMetrics();
      updateSetupState();
    }

    function isPhoneMode() {
      return phoneMode;
    }

    function syncViewportMetrics() {
      const metrics = getViewportMetrics();
      const topInset = phoneMode ? clampViewportInset(metrics.top) : 0;

      document.documentElement.style.setProperty("--visible-viewport-height", `${metrics.height}px`);
      document.documentElement.style.setProperty("--phone-top-inset", `${topInset}px`);
    }

    function scrollToTop() {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    function measureBoardFit() {
      const viewport = getViewportMetrics();
      syncViewportMetrics();
      const shell = elements.gameScreen.closest(".shell");
      const shellWidth = shell?.clientWidth || viewport.width;
      const horizontalPadding = phoneMode ? 20 : 64;
      const maxWidth = Math.max(260, Math.min(shellWidth, viewport.width - horizontalPadding));
      const readingMode = elements.setupForm.elements.challenge.value === GAME_TYPES.reading;
      const fallbackHeader = phoneMode
        ? (readingMode ? 128 : 72)
        : (readingMode ? 106 : 78);
      const headerHeight = visibleHeight(elements.gameHeader, fallbackHeader);
      const controlsHeight = phoneMode ? visibleHeight(elements.mobileControls, 126) : 0;
      const verticalSpace = phoneMode ? 42 : 104;
      const topInset = phoneMode ? clampViewportInset(viewport.top) : 0;
      const maxHeight = Math.max(
        phoneMode ? 160 : 260,
        viewport.height - topInset - headerHeight - controlsHeight - verticalSpace,
      );

      return {
        maxHeight,
        maxWidth,
        phoneMode,
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
      scrollToTop,
      setPauseButtonPaused,
      setPhoneMode,
      showGameScreen,
      showOverlay,
      showSetupScreen,
      isPhoneMode,
      syncViewportMetrics,
      updateSetupState,
    };

    function populateDictionarySelect() {
      const select = elements.setupForm.elements.dictionaryId;
      const options = window.SnakeDictionary?.getOptions?.() ?? DICTIONARIES;

      select.innerHTML = "";
      for (const option of options) {
        const entry = document.createElement("option");
        entry.value = option.id;
        entry.textContent = option.label;
        entry.disabled = option.available === false;
        select.append(entry);
      }

      select.value = isDictionaryId(DEFAULT_DICTIONARY_ID)
        ? DEFAULT_DICTIONARY_ID
        : select.options[0]?.value ?? "";
    }

    function populateColorPickers() {
      const pickers = elements.setupScreen.querySelectorAll("[data-color-picker]");

      for (const picker of pickers) {
        const playerIndex = Number(picker.dataset.colorPicker);
        const groupName = getColorGroupName(playerIndex);
        const options = picker.querySelector("[data-color-options]");
        const defaultColor = normalizePlayerColor(DEFAULT_PLAYERS[playerIndex]?.color, playerIndex);

        options.innerHTML = "";
        for (const color of PLAYER_COLORS) {
          const id = `${groupName}-${color.name.toLowerCase()}`;
          const label = document.createElement("label");
          label.className = "color-option";
          label.title = color.name;

          const input = document.createElement("input");
          input.type = "radio";
          input.name = groupName;
          input.id = id;
          input.value = color.value;
          input.setAttribute("aria-label", color.name);
          input.checked = color.value.toLowerCase() === defaultColor.toLowerCase();

          const swatch = document.createElement("span");
          swatch.className = "color-swatch";
          swatch.style.setProperty("--swatch-color", color.value);

          label.append(input, swatch);
          options.append(label);
        }
      }
    }

    function populateControlHints() {
      const rows = elements.setupScreen.querySelectorAll("[data-controls-player]");

      for (const row of rows) {
        const playerIndex = Number(row.dataset.controlsPlayer);
        const labels = getControlLabels(playerIndex);

        row.innerHTML = "";
        row.style.gridTemplateColumns = `repeat(${Math.max(1, labels.length)}, var(--keycap-width, 25px))`;

        for (const label of labels.length ? labels : ["-"]) {
          const key = document.createElement("kbd");
          key.textContent = label;
          row.append(key);
        }
      }
    }
  }

  function sanitizeName(value, fallback) {
    const trimmed = value.trim().replace(/\s+/g, " ");
    return trimmed || fallback;
  }

  function getColorGroupName(playerIndex) {
    return playerIndex === 0 ? "playerOneColor" : "playerTwoColor";
  }

  function readPlayerColor(playerIndex) {
    const group = getSetupForm()?.elements[getColorGroupName(playerIndex)];

    return normalizePlayerColor(group?.value, playerIndex);
  }

  function setPlayerColor(playerIndex, color) {
    const group = getSetupForm()?.elements[getColorGroupName(playerIndex)];
    if (group) {
      group.value = normalizePlayerColor(color, playerIndex);
    }
  }

  function setColorPickerDisabled(playerIndex, disabled) {
    const group = getSetupForm()?.elements[getColorGroupName(playerIndex)];
    if (!group) {
      return;
    }

    const controls = typeof group.length === "number" ? Array.from(group) : [group];
    for (const control of controls) {
      control.disabled = disabled;
    }
  }

  function getSetupForm() {
    return document.querySelector("#setupForm");
  }

  function normalizePlayerColor(color, playerIndex) {
    const defaultColor = DEFAULT_PLAYERS[playerIndex]?.color ?? PLAYER_COLORS[0]?.value ?? "#51d88a";
    const normalized = normalizeHexColor(color);
    if (!normalized) {
      return defaultColor;
    }

    const exact = PLAYER_COLORS.find((entry) => entry.value.toLowerCase() === normalized.toLowerCase());
    return exact?.value ?? closestPlayerColor(normalized, defaultColor);
  }

  function closestPlayerColor(color, fallback) {
    const source = hexToRgb(color);
    if (!source) {
      return fallback;
    }

    let closest = PLAYER_COLORS[0]?.value ?? fallback;
    let closestDistance = Infinity;
    for (const option of PLAYER_COLORS) {
      const target = hexToRgb(option.value);
      if (!target) {
        continue;
      }

      const distance = (
        (source.r - target.r) ** 2 +
        (source.g - target.g) ** 2 +
        (source.b - target.b) ** 2
      );
      if (distance < closestDistance) {
        closest = option.value;
        closestDistance = distance;
      }
    }

    return closest;
  }

  function normalizeHexColor(color) {
    if (typeof color !== "string") {
      return null;
    }

    const hex = color.trim().replace(/^#/, "");
    return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null;
  }

  function hexToRgb(color) {
    const normalized = normalizeHexColor(color);
    if (!normalized) {
      return null;
    }

    const value = Number.parseInt(normalized.slice(1), 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function isDictionaryId(id) {
    return DICTIONARIES.some((dictionary) => dictionary.id === id);
  }

  function getControlLabels(playerIndex) {
    return CONTROL_HINT_DIRECTIONS.flatMap((direction) => (
      Object.entries(KEY_MAP)
        .filter(([, binding]) => binding.player === playerIndex && binding.dir === direction)
        .map(([code]) => formatKeyCode(code))
    ));
  }

  function formatKeyCode(code) {
    const labels = {
      ArrowUp: "\u2191",
      ArrowLeft: "\u2190",
      ArrowDown: "\u2193",
      ArrowRight: "\u2192",
      Space: "Space",
      Enter: "Enter",
      Escape: "Esc",
    };

    if (labels[code]) {
      return labels[code];
    }
    if (/^Key[A-Z]$/.test(code)) {
      return code.slice(3);
    }
    if (/^Digit[0-9]$/.test(code)) {
      return code.slice(5);
    }
    if (/^Numpad[0-9]$/.test(code)) {
      return `Num ${code.slice(6)}`;
    }

    return code.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  function cssVar(rootStyle, name) {
    return rootStyle.getPropertyValue(name).trim();
  }

  function visibleHeight(element, fallback) {
    const rect = element?.getBoundingClientRect();
    return rect?.height > 0 ? rect.height : fallback;
  }

  function getViewportMetrics() {
    const viewport = window.visualViewport;

    return {
      width: viewport?.width || document.documentElement.clientWidth || window.innerWidth || 960,
      height: viewport?.height || document.documentElement.clientHeight || window.innerHeight || 720,
      top: Math.max(0, viewport?.offsetTop || 0),
    };
  }

  function clampViewportInset(value) {
    return Math.min(72, Math.max(0, value || 0));
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
