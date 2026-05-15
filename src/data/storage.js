/**
 * Storage bridge
 * - Electron: electron-store (disco, persiste entre reinicios)
 * - Web/dev:  localStorage
 */

const isElectron = () =>
  typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

export async function storageGet(key) {
  if (isElectron()) {
    try {
      const val = await window.electronAPI.store.get(key);
      return val ?? null;
    } catch (e) {
      console.warn('storageGet error:', key, e);
      return null;
    }
  }
  try {
    const v = localStorage.getItem('florida_' + key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export async function storageSet(key, value) {
  if (isElectron()) {
    try {
      return await window.electronAPI.store.set(key, value);
    } catch (e) {
      console.warn('storageSet error:', key, e);
      return false;
    }
  }
  try {
    localStorage.setItem('florida_' + key, JSON.stringify(value));
    return true;
  } catch { return false; }
}

export async function storageDelete(key) {
  if (isElectron()) {
    try { return await window.electronAPI.store.delete(key); }
    catch { return false; }
  }
  localStorage.removeItem('florida_' + key);
  return true;
}
