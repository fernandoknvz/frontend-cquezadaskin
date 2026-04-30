const CLIENT_TOKEN_KEY = "iskio_client_token";
const CLIENT_KEY = "iskio_client_profile";

let memoryClientToken: string | null = null;

export const getClientToken = () => {
  if (memoryClientToken) return memoryClientToken;
  const stored = localStorage.getItem(CLIENT_TOKEN_KEY);
  memoryClientToken = stored;
  return stored;
};

export const setClientToken = (token: string | null) => {
  memoryClientToken = token;
  if (token) {
    localStorage.setItem(CLIENT_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(CLIENT_TOKEN_KEY);
  }
};

export const getStoredClient = () => {
  const raw = localStorage.getItem(CLIENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

export const setStoredClient = (client: unknown | null) => {
  if (!client) {
    localStorage.removeItem(CLIENT_KEY);
    return;
  }
  localStorage.setItem(CLIENT_KEY, JSON.stringify(client));
};

export const clearClientSession = () => {
  setClientToken(null);
  setStoredClient(null);
};
