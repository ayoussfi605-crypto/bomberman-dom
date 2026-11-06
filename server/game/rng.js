// Mulberry32: the same seed produces the same sequence of numbers.
export function mulberry32(seed) {
  let state = seed >>> 0;

  return function random() {
    // Advance the state, keeping it within an unsigned 32-bit integer.
    state = (state + 0x6D2B79F5) >>> 0;

    // Mix the bits using the standard Mulberry32 formula.
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    // Convert the result to a number from 0 (included) to 1 (excluded).
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
