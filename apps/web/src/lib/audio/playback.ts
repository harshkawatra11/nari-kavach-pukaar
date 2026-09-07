import { b64ToBytes } from "./b64";

/** Schedules decoded WAV buffers back to back on a dedicated playback
 *  AudioContext, using a playhead cursor rather than new Audio() per chunk so
 *  sentence chunks never overlap. Deliberately a separate context from mic
 *  capture: capture is pinned to 16kHz for STT, and decoding a 24kHz TTS WAV
 *  into a 16kHz context resamples badly.
 *
 *  Every buffer source routes through one shared AnalyserNode before
 *  destination, so the orb can read how loud Pukaar is speaking, in real
 *  time, without re-decoding anything. */
export class AudioPlaybackQueue {
  private ctx: AudioContext;
  private playhead = 0;
  readonly analyser: AnalyserNode;
  private timeDomainBuffer: Uint8Array;
  private pendingSources = 0;

  constructor(private readonly onIdle?: () => void) {
    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.connect(this.ctx.destination);
    this.timeDomainBuffer = new Uint8Array(this.analyser.fftSize);
  }

  async resume() {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  async enqueueWavBase64(b64: string): Promise<void> {
    await this.resume();
    const bytes = b64ToBytes(b64);
    const buf = await this.ctx.decodeAudioData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.analyser);
    this.pendingSources += 1;
    src.onended = () => {
      this.pendingSources = Math.max(0, this.pendingSources - 1);
      if (this.pendingSources === 0) this.onIdle?.();
    };
    const startAt = Math.max(this.ctx.currentTime, this.playhead);
    src.start(startAt);
    this.playhead = startAt + buf.duration;
  }

  /** RMS of the current output buffer, 0..1. Cheap enough to call every
   *  animation frame; callers should write the result into a ref, never
   *  React state, or the 60fps read triggers a 60fps re-render. */
  getLevel(): number {
    // TS's DOM lib types getByteTimeDomainData as wanting Uint8Array<ArrayBuffer>
    // specifically; `new Uint8Array(n)` is typed as the more general
    // Uint8Array<ArrayBufferLike>, which is the actual runtime type either way.
    this.analyser.getByteTimeDomainData(this.timeDomainBuffer as Uint8Array<ArrayBuffer>);
    let sumSquares = 0;
    for (let i = 0; i < this.timeDomainBuffer.length; i++) {
      const centered = (this.timeDomainBuffer[i] - 128) / 128;
      sumSquares += centered * centered;
    }
    return Math.sqrt(sumSquares / this.timeDomainBuffer.length);
  }

  close() {
    this.pendingSources = 0;
    void this.ctx.close();
  }
}
