(function (window, document) {
  "use strict";

  const RUNTIME_SCRIPTS = [
    "dictionary.js",
    "storage.js",
    "url-state.js",
    "engine.js",
    "renderer.js",
    "ui.js",
    "sound.js",
    "app.js",
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
    await loadScript("config.js");

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
