const TOKEN_KEY = "iskio_auth_token";
const USER_KEY = "iskio_auth_user";
const REMEMBER_KEY = "iskio_auth_remember";

let memoryToken: string | null = null;

export const getAccessToken = () => {
  if (memoryToken) return memoryToken;
  const storedLocal = localStorage.getItem(TOKEN_KEY);
  if (storedLocal) {
    memoryToken = storedLocal;
    return storedLocal;
  }
  const storedSession = sessionStorage.getItem(TOKEN_KEY);
  if (storedSession) {
    memoryToken = storedSession;
    return storedSession;
  }
  return null;
};

export const setAccessToken = (token: string | null, persist = true) => {
  memoryToken = token;
  if (token) {
    if (persist) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  } else {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
};

export const getRememberSession = () =>
  localStorage.getItem(REMEMBER_KEY) === "true";

export const setRememberSession = (remember: boolean) => {
  localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
};

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: number | string; username: string; rol: string };
  } catch {
    return null;
  }
};

export const setStoredUser = (user: unknown | null, persist = true) => {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    return;
  }
  const serialized = JSON.stringify(user);
  if (persist) {
    localStorage.setItem(USER_KEY, serialized);
    sessionStorage.removeItem(USER_KEY);
  } else {
    sessionStorage.setItem(USER_KEY, serialized);
    localStorage.removeItem(USER_KEY);
  }
};

export const clearAuthStorage = () => {
  setAccessToken(null);
  setStoredUser(null);
  localStorage.removeItem(REMEMBER_KEY);
};
