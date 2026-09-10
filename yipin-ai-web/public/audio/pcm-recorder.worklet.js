class PcmRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunkSize = 2048;
    this.chunk = new Float32Array(this.chunkSize);
    this.offset = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    let cursor = 0;
    while (cursor < channel.length) {
      const writable = Math.min(this.chunkSize - this.offset, channel.length - cursor);
      this.chunk.set(channel.subarray(cursor, cursor + writable), this.offset);
      this.offset += writable;
      cursor += writable;

      if (this.offset === this.chunkSize) {
        const completedChunk = this.chunk;
        this.port.postMessage(completedChunk, [completedChunk.buffer]);
        this.chunk = new Float32Array(this.chunkSize);
        this.offset = 0;
      }
    }

    return true;
  }
}

registerProcessor("yipin-pcm-recorder", PcmRecorderProcessor);
