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

  boot().catch((error) => {
    console.error(error);
    const message = document.createElement("pre");
    message.textContent = `Unable to start Snake.\n\n${error.message}`;
    message.style.whiteSpace = "pre-wrap";
    message.style.margin = "24px";
    document.body.append(message);
  });

  async function boot() {
    await loadScript("src/config.js");

    for (const script of getDictionaryScripts()) {
      await loadScript(script);
    }

    for (const script of RUNTIME_SCRIPTS) {
      await loadScript(script);
    }
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
})(window, document);
