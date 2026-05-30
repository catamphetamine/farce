// `session.key` exists to avoid `location.key` collision after a page refresh.
//
// After a page refresh, a previous `session` instance ceases to exist
// because it's a regular javascript variable, and all javascript variables
// are destroyed on page refresh. So a new `session` instance is created from scratch.
// In that new `session` instance, "next location ID counter" variable is also
// re-created from scratch, with the standard initial value of `0`.
//
// But web browser history is a different "beast": it "survives" page reload, by design.
// So after a page refresh, all that navigation history is not "lost" and keeps existing.
// Hence, all the previously-visited `location` objects from the previous session keep existing.
// But all those `location` objects from the previous session already have non-zero "location ID",
// and in order for new `location` objects' IDs to be truly unique, they should either start
// from the previously-saved "next location ID counter" of the previous session,
// or each `location` object's ID should be modified to include a given session's "prefix"
// which should be unique between different sessions.
//
// The first way with storing the previous session's "next location ID counter" could be used,
// but it would tightly couple "session" and "data storage" concepts.
// It means that it would have to demand every environment to have a valid implementation of
// a "data storage" that survives page reload, etc. This type of "data storage" does exist
// for each of the currently supported environments, but it could hypothetically be a blocker
// for some new type of exotic environment in some potential future.
//
// The second way is simple — each `location` object's ID could be prefixed with a given session's "key".
// And a session's "key" is just a timestamp of when the `session` instance was created.
// Simple and unique-enough.
//
// So, to reiterate, after a page refresh and further navigation, web browser navigation history
// will contain both pre-refresh entries and post-refresh entries.
// Those entries are from different sessions: pre-refresh session and post-refresh session.
// In order to prevent `location.key` collision between those two sessions,
// each `location.key` must be unique.
//
export default function createSessionKey() {
  return Date.now().toString(36);
}
