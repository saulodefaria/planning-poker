const WAITING_NUDGE_SOUND_PATH = "/sounds/waiting-nudge.wav";

let audioContext: AudioContext | null = null;
let waitingNudgeAudio: HTMLAudioElement | null = null;

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioWindow = window as AudioWindow;
  const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContextCtor();
  }

  return audioContext;
}

function getWaitingNudgeAudio(): HTMLAudioElement | null {
  if (typeof Audio === "undefined") {
    return null;
  }

  if (!waitingNudgeAudio) {
    waitingNudgeAudio = new Audio(WAITING_NUDGE_SOUND_PATH);
    waitingNudgeAudio.preload = "auto";
    waitingNudgeAudio.volume = 0.8;
  }

  return waitingNudgeAudio;
}

async function playWaitingNudgeAsset(): Promise<boolean> {
  const audio = getWaitingNudgeAudio();

  if (!audio) {
    return false;
  }

  try {
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

async function playWaitingNudgeFallback(): Promise<void> {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime;
  const endTime = startTime + 0.22;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(880, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(660, endTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.028, startTime + 0.025);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.onended = () => {
    oscillator.disconnect();
    gainNode.disconnect();
  };

  oscillator.start(startTime);
  oscillator.stop(endTime);
}

export async function playWaitingNudgeSound(): Promise<void> {
  const assetPlayed = await playWaitingNudgeAsset();

  if (assetPlayed) {
    return;
  }

  await playWaitingNudgeFallback();
}
