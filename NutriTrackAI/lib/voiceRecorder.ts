// lib/voiceRecorder.ts
// Thin wrapper around expo-av Audio.Recording.
// Handles permission, start/stop, and 15-second auto-stop.

import { Audio } from 'expo-av';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RecorderHandle {
  /** Stop recording early. Returns the audio file URI. */
  stop: () => Promise<string>;
  /** Cancel without producing a file (e.g. component unmounting). */
  cancel: () => Promise<void>;
}

// ─── Recording preset ──────────────────────────────────────────────────────────

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};

const AUTO_STOP_MS = 15_000; // 15 seconds

// ─── startRecording ────────────────────────────────────────────────────────────

/**
 * Request microphone permission then start recording.
 *
 * @param onAutoStop  Called when the 15-second auto-stop fires.
 *                    Receives the file URI, same as calling stop() manually.
 * @returns RecorderHandle with stop() and cancel()
 * @throws  if permission is denied or recording fails to start
 */
export async function startRecording(
  onAutoStop: (uri: string) => void,
): Promise<RecorderHandle> {
  // 1. Permission
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Microphone permission denied');
  }

  // 2. Configure audio session
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  // 3. Create and start recording
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(RECORDING_OPTIONS);
  await recording.startAsync();

  let stopped = false;

  // 4. 15-second auto-stop
  const autoTimer = setTimeout(async () => {
    if (!stopped) {
      stopped = true;
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI() ?? '';
        // Restore audio session
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        onAutoStop(uri);
      } catch (e) {
        console.warn('[voiceRecorder] Auto-stop error:', e);
      }
    }
  }, AUTO_STOP_MS);

  // ── Handle ────────────────────────────────────────────────────────────────

  const stop = async (): Promise<string> => {
    if (stopped) return '';
    stopped = true;
    clearTimeout(autoTimer);

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI() ?? '';
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    return uri;
  };

  const cancel = async (): Promise<void> => {
    if (stopped) return;
    stopped = true;
    clearTimeout(autoTimer);
    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // ignore errors during cleanup
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  };

  return { stop, cancel };
}
