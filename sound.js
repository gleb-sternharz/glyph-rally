(function (window) {
  "use strict";

  function createSound() {
    let context = null;

    function unlock() {
      const audio = getContext();
      if (!audio) {
        return;
      }

      resume(audio);
    }

    function goodHit() {
      playSequence([
        { frequency: 523.25, duration: 0.06, type: "triangle", gain: 0.09 },
        { frequency: 659.25, duration: 0.07, type: "triangle", gain: 0.09 },
        { frequency: 783.99, duration: 0.09, type: "triangle", gain: 0.08 },
      ]);
    }

    function badHit() {
      playSequence([
        { frequency: 220, duration: 0.08, type: "sawtooth", gain: 0.07 },
        { frequency: 155.56, duration: 0.12, type: "sawtooth", gain: 0.06 },
      ]);
    }

    function gameOver() {
      playSequence([
        { frequency: 392, duration: 0.12, type: "square", gain: 0.06 },
        { frequency: 293.66, duration: 0.14, type: "square", gain: 0.055 },
        { frequency: 196, duration: 0.22, type: "square", gain: 0.05 },
      ]);
    }

    function playSequence(notes) {
      const audio = getContext();
      if (!audio) {
        return;
      }

      resume(audio);

      let start = audio.currentTime;
      for (const note of notes) {
        playTone(audio, start, note);
        start += note.duration;
      }
    }

    function playTone(audio, start, note) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const end = start + note.duration;

      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    }

    function resume(audio) {
      if (audio.state !== "suspended") {
        return;
      }

      const resumePromise = audio.resume();
      if (resumePromise?.catch) {
        resumePromise.catch(() => {});
      }
    }

    function getContext() {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          return null;
        }

        context = new AudioContext();
      }

      return context;
    }

    return {
      badHit,
      gameOver,
      goodHit,
      unlock,
    };
  }

  window.SnakeSound = {
    createSound,
  };
})(window);
