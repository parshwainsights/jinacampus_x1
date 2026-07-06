import * as SecureStore from "expo-secure-store";

const SESSION_TOKEN_KEY = "jinacampus.mobile.session_token";

export function getMobileToken() {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export function saveMobileToken(token: string) {
  return SecureStore.setItemAsync(SESSION_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
  });
}

export function clearMobileToken() {
  return SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}

export const sessionStore = {
  getToken: getMobileToken,
  setToken: saveMobileToken,
  clearToken: clearMobileToken
};
