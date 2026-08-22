const STORAGE_KEY = 'screenshare:server';

/** Endereço padrão: usado na primeira execução e no desenvolvimento. */
const DEFAULT_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

function normalize(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_URL;
  // Digitar só "192.168.0.10:3001" é o caso comum: completamos o esquema.
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

/** Endereço em uso nesta sessão. Lido uma vez: trocar exige recarregar. */
export const SERVER_URL: string = normalize(
  localStorage.getItem(STORAGE_KEY) ?? DEFAULT_URL
);

export function getServerUrl(): string {
  return SERVER_URL;
}

/** Salva o novo endereço e reinicia o app para reconectar do zero. */
export function setServerUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, normalize(url));
  window.location.reload();
}

export function resetServerUrl(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

export const DEFAULT_SERVER_URL = DEFAULT_URL;
