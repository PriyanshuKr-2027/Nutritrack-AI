// lib/voiceRecorder.ts
// Thin wrapper around expo-audio AudioRecorder.
// Handles permission, start/stop, and 15-second auto-stop.

import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RecorderHandle {
  /** Stop recording early. Returns the audio file URI. */
  stop: () => Promise<string>;
  /** Cancel without producing a file (e.g. component unmounting). */
  cancel: () => Promise<void>;
}

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
  const { granted } = await AudioModule.requestRecordingPermissionsAsync();
  if (!granted) {
    throw new Error('Microphone permission denied');
  }

  // 2. Create recorder and start
  const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
  await recorder.record();

  let stopped = false;

  // 3. 15-second auto-stop
  const autoTimer = setTimeout(async () => {
    if (!stopped) {
      stopped = true;
      try {
        const uri = await recorder.stop();
        onAutoStop(uri ?? '');
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
    const uri = await recorder.stop();
    return uri ?? '';
  };

  const cancel = async (): Promise<void> => {
    if (stopped) return;
    stopped = true;
    clearTimeout(autoTimer);
    try {
      await recorder.stop();
    } catch {
      // ignore errors during cleanup
    }
  };

  return { stop, cancel };
}
