// `session.key` exists to avoid `location.key` collision after a page refresh.
// After a page refresh, a different `session.key` is created
// while the previous navigation history still exists because
// web browser navigation history survives a page reload.
// So web browser navigation history after a refresh contains records from different sessions.
// This means that some of those history records end up having same `location.key`s
// because `location.key` always starts from `0` for each different session.
// So `location.key` alone can't be used to identify navigation history entries
// because it's not unique among them. In order to get a unique key for a navigation history entry,
// one should combine a unique `session.key` with a `location.key`.
// That's what `session.key` exists for.
// Supplementary features such as scroll position restoration
// use `window.sessionStorage` to store supplementary data for a given navigation history entry.
// Because `window.sessionStorage` is shared between all navigation history entries from different websites,
// the keys used for storing that supplementary data have to be unique.
export default function createSessionKey() {
  return Date.now().toString(36);
}
