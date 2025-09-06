export default class WebBrowserDataStorage {
  // Returns either a `string` value or `null` if the key doesn't exist.
  get(key) {
    // `sessionStorage` persists across page reloads, and so does web browser navigation history.
    return window.sessionStorage.getItem(key);
  }

  remove(key) {
    // `sessionStorage` persists across page reloads, and so does web browser navigation history.
    window.sessionStorage.removeItem(key);
  }

  set(key, value) {
    // `sessionStorage` persists across page reloads, and so does web browser navigation history.
    window.sessionStorage.setItem(key, value);
  }
}
