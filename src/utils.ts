let lastMessage = '';

export function logStatusMessage(color: string, message: string) {
  if (message !== lastMessage) {
    logColor(color, message);
  }
  lastMessage = message;
}

export function log(message: string, ...args: unknown[]) {
  logColor('initial', message, ...args);
}
export function logColor(color: string, message: string, ...args: unknown[]) {
  const ts = `[${new Date().toLocaleTimeString()}]`;
  console.log(`%c${ts} ${message}`, `color:${color}`, ...args);
}
export function logError(e: unknown) {
  const msg =
    e instanceof Error
      ? `${e.name} ${e.message}\n${e.stack}`
      : JSON.stringify(e);
  logColor('red', msg);
}
export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
