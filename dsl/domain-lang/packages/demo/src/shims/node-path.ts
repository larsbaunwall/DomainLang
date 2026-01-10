export function join(...segments: string[]): string {
  return segments.filter(Boolean).join('/');
}

export function dirname(pathValue: string): string {
  const normalized = pathValue.endsWith('/') ? pathValue.slice(0, -1) : pathValue;
  const index = normalized.lastIndexOf('/');
  return index === -1 ? '.' : normalized.slice(0, index);
}

export function basename(pathValue: string): string {
  const normalized = pathValue.endsWith('/') ? pathValue.slice(0, -1) : pathValue;
  const index = normalized.lastIndexOf('/');
  return index === -1 ? normalized : normalized.slice(index + 1);
}

export const sep = '/';

const pathShim = { join, dirname, basename, sep };
export default pathShim;
