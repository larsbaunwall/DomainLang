export const isMainThread = true;

export function Worker(): never {
  throw new Error('worker_threads is not available in the browser demo');
}

const workerThreadsShim = { isMainThread, Worker };
export default workerThreadsShim;
