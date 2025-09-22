class Processor extends AudioWorkletProcessor {
  process([inputs], [outputs]) {
    // inputs/outputs are arrays of channels. Guard for missing channels.
    const input = inputs && inputs[0];
    const output = outputs && outputs[0];
    if (!input || !output) return true;

    // Copy each channel from input -> output (pass-through monitor)
    const ch = Math.min(input.length, output.length);
    for (let i = 0; i < ch; i++) {
      output[i].set(input[i]);
    }
    return true; // keep processor alive
  }
}

registerProcessor("processor", Processor);