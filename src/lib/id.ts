/**
 * Ids are UUIDs now, and the client mints them.
 *
 * The prefix is kept for readability in logs and is ignored by the generator —
 * changing every call site would be churn for nothing. What matters is the
 * shape: these ids go straight into Postgres as the row's primary key, so a
 * newly created plan keeps the same id on both sides of the round trip.
 *
 * The prototype's `pl-k3f9x2a` style ids could not do that. The server minted
 * its own on insert, so the moment the reload landed, the id in the address
 * bar belonged to a plan that no longer existed and the screen fell over.
 */
export function uid(prefix = 'x'): string {
  void prefix;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Older Safari, and any non-secure context. Same shape, weaker entropy.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
