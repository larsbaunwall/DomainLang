function notAvailable(operation: string): never {
  throw new Error(`fs:${operation} is not available in the browser demo`);
}

function notAvailableAsync(operation: string): Promise<never> {
  return Promise.reject(new Error(`fs:${operation} is not available in the browser demo`));
}

export function readFileSync(): never {
  return notAvailable('readFileSync');
}

export function existsSync(): boolean {
  return false;
}

export function statSync(): { isFile: () => boolean; isDirectory: () => boolean } {
  return { isFile: () => false, isDirectory: () => false };
}

export async function stat(): Promise<{ isFile: () => boolean; isDirectory: () => boolean }> {
  return statSync();
}

export function readdirSync(): string[] {
  return [];
}

export async function readdir(): Promise<string[]> {
  return readdirSync();
}

export const promises = {
  readFile: (): Promise<never> => notAvailableAsync('readFile'),
  stat,
  readdir
};

const fsShim = { readFileSync, existsSync, statSync, stat, readdirSync, readdir, promises };
export default fsShim;
