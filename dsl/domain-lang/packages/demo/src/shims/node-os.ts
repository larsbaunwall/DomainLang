export function homedir(): string {
  return '/';
}

export function tmpdir(): string {
  return '/tmp';
}

const osShim = { homedir, tmpdir };
export default osShim;
