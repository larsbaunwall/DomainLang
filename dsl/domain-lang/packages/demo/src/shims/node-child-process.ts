export function exec(): never {
  throw new Error('child_process.exec is not available in the browser demo');
}

const childProcessShim = { exec };
export default childProcessShim;
