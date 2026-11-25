export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioBase64(
  ctx: AudioContext,
  base64: string
): Promise<AudioBuffer> {
  const bytes = base64ToUint8Array(base64);
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return await ctx.decodeAudioData(copy.buffer);
}

export function getWavDurationSec(base64: string): number {
  try {
    const bytes = base64ToUint8Array(base64);
    if (bytes.length < 44) return 5;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const byteRate = view.getUint32(28, true);
    const dataSize = bytes.length - 44;
    if (byteRate > 0) {
      return Math.max(1, dataSize / byteRate);
    }
  } catch {
    // ignore parse failure
  }
  return 5;
}
