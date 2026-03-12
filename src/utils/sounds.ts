// Sound utility using Web Audio API for app sounds

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
};

// Play a sequence of tones
const playTones = (
  tones: Array<{ freq: number; duration: number; delay: number; type?: OscillatorType; gain?: number }>
) => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  tones.forEach(({ freq, duration, delay, type = "sine", gain = 0.3 }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.frequency.value = freq;
    osc.type = type;
    gainNode.gain.setValueAtTime(gain, now + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

    osc.start(now + delay);
    osc.stop(now + delay + duration + 0.05);
  });
};

// Message sent sound - quick ascending "whoosh"
export const playMessageSentSound = () => {
  playTones([
    { freq: 600, duration: 0.08, delay: 0, type: "sine", gain: 0.2 },
    { freq: 900, duration: 0.08, delay: 0.05, type: "sine", gain: 0.25 },
    { freq: 1200, duration: 0.1, delay: 0.1, type: "sine", gain: 0.15 },
  ]);
};

// Message received sound - gentle descending chime
export const playMessageReceivedSound = () => {
  playTones([
    { freq: 1200, duration: 0.12, delay: 0, type: "sine", gain: 0.25 },
    { freq: 900, duration: 0.12, delay: 0.08, type: "sine", gain: 0.2 },
    { freq: 700, duration: 0.15, delay: 0.16, type: "sine", gain: 0.15 },
  ]);
};

// Notification sound - double chime
export const playNotificationSound = () => {
  playTones([
    { freq: 880, duration: 0.15, delay: 0, type: "sine", gain: 0.3 },
    { freq: 1100, duration: 0.2, delay: 0.15, type: "sine", gain: 0.25 },
    { freq: 1320, duration: 0.25, delay: 0.3, type: "sine", gain: 0.2 },
  ]);
};

// Ringtone - repeating melodic pattern
let ringtoneInterval: ReturnType<typeof setInterval> | null = null;
let ringtoneActive = false;

const playRingtonePattern = () => {
  playTones([
    { freq: 523, duration: 0.2, delay: 0, type: "sine", gain: 0.35 },
    { freq: 659, duration: 0.2, delay: 0.25, type: "sine", gain: 0.35 },
    { freq: 784, duration: 0.2, delay: 0.5, type: "sine", gain: 0.35 },
    { freq: 659, duration: 0.2, delay: 0.75, type: "sine", gain: 0.3 },
    { freq: 784, duration: 0.3, delay: 1.0, type: "sine", gain: 0.35 },
    { freq: 1047, duration: 0.4, delay: 1.3, type: "sine", gain: 0.3 },
  ]);
};

export const startRingtone = () => {
  if (ringtoneActive) return;
  ringtoneActive = true;
  playRingtonePattern();
  ringtoneInterval = setInterval(playRingtonePattern, 2500);
};

export const stopRingtone = () => {
  ringtoneActive = false;
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
};

// Outgoing call sound - repeating "ring ring"
let outgoingInterval: NodeJS.Timeout | null = null;
let outgoingActive = false;

const playOutgoingPattern = () => {
  playTones([
    { freq: 440, duration: 0.5, delay: 0, type: "sine", gain: 0.25 },
    { freq: 440, duration: 0.5, delay: 0.7, type: "sine", gain: 0.25 },
  ]);
};

export const startOutgoingCallSound = () => {
  if (outgoingActive) return;
  outgoingActive = true;
  playOutgoingPattern();
  outgoingInterval = setInterval(playOutgoingPattern, 3000);
};

export const stopOutgoingCallSound = () => {
  outgoingActive = false;
  if (outgoingInterval) {
    clearInterval(outgoingInterval);
    outgoingInterval = null;
  }
};

// Call connected sound - cheerful ascending
export const playCallConnectedSound = () => {
  playTones([
    { freq: 523, duration: 0.12, delay: 0, type: "sine", gain: 0.3 },
    { freq: 659, duration: 0.12, delay: 0.1, type: "sine", gain: 0.3 },
    { freq: 784, duration: 0.2, delay: 0.2, type: "sine", gain: 0.25 },
  ]);
};

// Call ended sound - descending tones
export const playCallEndedSound = () => {
  playTones([
    { freq: 600, duration: 0.15, delay: 0, type: "sine", gain: 0.3 },
    { freq: 450, duration: 0.15, delay: 0.15, type: "sine", gain: 0.25 },
    { freq: 300, duration: 0.25, delay: 0.3, type: "sine", gain: 0.2 },
  ]);
};
