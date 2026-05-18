/**
 * Utility to play beep sounds for scanner feedback
 */

type AudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function createAudioContext() {
  const AudioContextCtor = window.AudioContext || (window as AudioContextWindow).webkitAudioContext;
  return AudioContextCtor ? new AudioContextCtor() : null;
}

export const playSuccessSound = () => {
  try {
    // Standard high-pitched beep
    const audioCtx = createAudioContext();
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio feedback failed", e);
  }
};

export const playErrorSound = () => {
  try {
    // Lower, double beep for error
    const audioCtx = createAudioContext();
    if (!audioCtx) return;
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.1, start);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(220, audioCtx.currentTime, 0.15); // Low A3
    playTone(220, audioCtx.currentTime + 0.2, 0.15);
  } catch (e) {
    console.warn("Audio feedback failed", e);
  }
};
