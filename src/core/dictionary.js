(function (window) {
  "use strict";

  const { DEFAULT_DICTIONARY_ID, DICTIONARIES } = window.SnakeConfig;
  const dictionaries = new Map();
  const imageCache = new Map();

  for (const option of DICTIONARIES) {
    const dictionary = parseDictionary(option);
    if (dictionary) {
      dictionaries.set(option.id, dictionary);
    }
  }

  function getOptions() {
    return DICTIONARIES.map((option) => {
      const dictionary = dictionaries.get(option.id);

      return {
        ...option,
        label: dictionary?.label ?? option.label,
        available: Boolean(dictionary),
      };
    });
  }

  function hasDictionary(id) {
    return dictionaries.has(id);
  }

  function getDictionary(id) {
    return dictionaries.get(id) ?? dictionaries.get(DEFAULT_DICTIONARY_ID) ?? null;
  }

  function getEntries(id) {
    return getDictionary(id)?.entries ?? [];
  }

  function drawIcon(ctx, item, tools) {
    if (!item.icon) {
      return;
    }

    const box = iconBox(item, tools.metrics);
    const image = getImage(item.icon);

    if (image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, box.x, box.y, box.size, box.size);
      return;
    }

    drawIconFallback(ctx, box, tools);
  }

  function preloadIcons(extraSources = []) {
    const sources = new Set(extraSources.filter((source) => typeof source === "string"));

    for (const dictionary of dictionaries.values()) {
      for (const entry of dictionary.entries) {
        sources.add(entry.icon);
      }
    }

    return Promise.allSettled([...sources].map(preloadIcon)).then(() => undefined);
  }

  function parseDictionary(option) {
    const data = window.SnakeDictionarySources?.[option.source];
    if (!data) {
      return null;
    }

    const rawEntries = Array.isArray(data) ? data : data.entries;
    const entries = Array.isArray(rawEntries)
      ? rawEntries.map(normalizeEntry).filter(Boolean)
      : [];

    return {
      id: option.id,
      label: data.label || option.label,
      source: option.source,
      entries,
    };
  }

  function normalizeEntry(entry) {
    if (
      !entry ||
      typeof entry.word !== "string" ||
      typeof entry.icon !== "string"
    ) {
      return null;
    }

    return {
      word: entry.word.toLocaleUpperCase(),
      icon: entry.icon,
      matchKey: entry.icon,
    };
  }

  function getImage(src) {
    let image = imageCache.get(src);

    if (!image) {
      image = new Image();
      image.decoding = "async";
      image.src = src;
      imageCache.set(src, image);
    }

    return image;
  }

  function preloadIcon(src) {
    return new Promise((resolve) => {
      const image = getImage(src);
      if (image.complete) {
        resolve();
        return;
      }

      const timeout = window.setTimeout(done, 1200);
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });

      function done() {
        window.clearTimeout(timeout);
        image.removeEventListener("load", done);
        image.removeEventListener("error", done);
        resolve();
      }
    });
  }

  function iconBox(item, metrics) {
    const padding = Math.max(0.25, metrics.cell * 0.02);

    return {
      x: metrics.offsetX + item.x * metrics.cell + padding,
      y: metrics.offsetY + item.y * metrics.cell + padding,
      size: metrics.cell - padding * 2,
    };
  }

  function drawIconFallback(ctx, box, tools) {
    const { palette, roundRect } = tools;

    ctx.fillStyle = palette.food;
    roundRect(ctx, box.x + box.size * 0.1, box.y + box.size * 0.1, box.size * 0.8, box.size * 0.8, box.size * 0.2);
    ctx.fill();

    ctx.fillStyle = palette.foodHighlight;
    ctx.beginPath();
    ctx.arc(box.x + box.size * 0.4, box.y + box.size * 0.36, box.size * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }

  window.SnakeDictionary = {
    drawIcon,
    getDictionary,
    getEntries,
    getOptions,
    hasDictionary,
    preloadIcons,
  };
})(window);
