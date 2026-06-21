(function (window, document) {
  "use strict";

  const RUNTIME_SCRIPTS = [
    "src/core/dictionary.js",
    "src/core/storage.js",
    "src/core/url-state.js",
    "src/core/engine.js",
    "src/presentation/renderer.js",
    "src/presentation/ui.js",
    "src/presentation/sound.js",
    "src/app.js",
  ];
  const loader = createLoadingController();
  const appReady = waitForAppReady();

  window.addEventListener("snake:loading-progress", (event) => {
    loader.update(event.detail?.progress, event.detail?.label);
  });

  boot().catch((error) => {
    console.error(error);
    loader.fail(error);
    const message = document.createElement("pre");
    message.textContent = `Unable to start Snake.\n\n${error.message}`;
    message.style.whiteSpace = "pre-wrap";
    message.style.margin = "24px";
    document.body.append(message);
  });

  async function boot() {
    loader.update(4, "Loading configuration");
    await loadScript("src/config.js");

    const dictionaryScripts = getDictionaryScripts();
    const scripts = [...dictionaryScripts, ...RUNTIME_SCRIPTS];
    const totalScripts = 1 + scripts.length;
    let loadedScripts = 1;

    loader.update(scriptProgress(loadedScripts, totalScripts), "Loading dictionaries");
    for (const script of dictionaryScripts) {
      await loadScript(script);
      loadedScripts += 1;
      loader.update(scriptProgress(loadedScripts, totalScripts), "Loading dictionaries");
    }

    loader.update(scriptProgress(loadedScripts, totalScripts), "Loading game");
    for (const script of RUNTIME_SCRIPTS) {
      await loadScript(script);
      loadedScripts += 1;
      loader.update(scriptProgress(loadedScripts, totalScripts), "Loading game");
    }

    loader.update(88, "Preparing board");
    await appReady;
    loader.complete();
  }

  function scriptProgress(loaded, total) {
    return Math.min(88, Math.round(4 + (loaded / total) * 82));
  }

  function getDictionaryScripts() {
    return window.SnakeConfig.DICTIONARIES.map((dictionary) => (
      `dictionaries/${dictionary.source}.js`
    ));
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.append(script);
    });
  }

  function waitForAppReady() {
    if (window.SnakeAppReady) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      window.addEventListener("snake:ready", resolve, { once: true });
    });
  }

  function createLoadingController() {
    const root = document.querySelector("#bootLoader");
    const progress = document.querySelector("#bootProgress");
    const bar = document.querySelector("#bootProgressBar");
    const text = document.querySelector("#bootProgressText");
    let current = 0;

    return {
      complete,
      fail,
      update,
    };

    function update(value, label) {
      if (!root) {
        return;
      }

      if (Number.isFinite(value)) {
        current = Math.max(current, Math.min(100, Math.max(0, value)));
        if (bar) {
          bar.style.width = `${current}%`;
        }
        progress?.setAttribute("aria-valuenow", String(Math.round(current)));
      }
      if (label && text) {
        text.textContent = label;
      }
    }

    function complete() {
      update(100, "Ready");
      root?.classList.add("is-complete");
      window.setTimeout(() => {
        if (root) {
          root.hidden = true;
        }
      }, 220);
    }

    function fail(error) {
      current = 100;
      if (bar) {
        bar.style.width = "100%";
      }
      progress?.setAttribute("aria-valuenow", "100");
      if (text) {
        text.textContent = `Unable to start Snake. ${error.message}`;
      }
    }
  }
})(window, document);
