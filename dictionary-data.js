(function (window) {
  "use strict";

  // Mirrors dictionaries/*.json because file:// pages cannot fetch local JSON.
  window.SnakeDictionaryFiles = {
    "dictionaries/english.json": `[
  { "word": "APPLE", "icon": "icons/apple.svg" },
  { "word": "PINE", "icon": "icons/pine.svg" },
  { "word": "CAR", "icon": "icons/car.svg" },
  { "word": "STAR", "icon": "icons/star.svg" },
  { "word": "MOON", "icon": "icons/moon.svg" },
  { "word": "HOUSE", "icon": "icons/house.svg" },
  { "word": "HEART", "icon": "icons/heart.svg" },
  { "word": "FISH", "icon": "icons/fish.svg" }
]`,
    "dictionaries/german.json": `[
  { "word": "APFEL", "icon": "icons/apple.svg" },
  { "word": "KIEFER", "icon": "icons/pine.svg" },
  { "word": "AUTO", "icon": "icons/car.svg" },
  { "word": "STERN", "icon": "icons/star.svg" },
  { "word": "MOND", "icon": "icons/moon.svg" },
  { "word": "HAUS", "icon": "icons/house.svg" },
  { "word": "HERZ", "icon": "icons/heart.svg" },
  { "word": "FISCH", "icon": "icons/fish.svg" }
]`,
    "dictionaries/russian.json": `[
  { "word": "ЯБЛОКО", "icon": "icons/apple.svg" },
  { "word": "СОСНА", "icon": "icons/pine.svg" },
  { "word": "МАШИНА", "icon": "icons/car.svg" },
  { "word": "ЗВЕЗДА", "icon": "icons/star.svg" },
  { "word": "ЛУНА", "icon": "icons/moon.svg" },
  { "word": "ДОМ", "icon": "icons/house.svg" },
  { "word": "СЕРДЦЕ", "icon": "icons/heart.svg" },
  { "word": "РЫБА", "icon": "icons/fish.svg" }
]`,
  };
})(window);
