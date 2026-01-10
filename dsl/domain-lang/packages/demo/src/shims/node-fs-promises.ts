function notAvailable(operation: string): Promise<never> {
  return Promise.reject(new Error(`fs:${operation} is not available in the browser demo`));
}

export async function readFile(): Promise<never> {
  return notAvailable('readFile');
}

export async function writeFile(): Promise<never> {
  return notAvailable('writeFile');
}

export async function access(): Promise<never> {
  return notAvailable('access');
}

const fsPromisesShim = { readFile, writeFile, access };
export default fsPromisesShim;
