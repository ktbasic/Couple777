/**
 * Raising a notification on the phone that is holding the app.
 *
 * What this is, precisely — because the difference matters and is easy to
 * overstate:
 *
 * When a notification row arrives for you over Realtime, the app is open. If
 * this browser has already been granted permission, the phone shows a real
 * system notification, so it lands on the lock screen or in the tray rather
 * than only inside a screen you may not be looking at.
 *
 * What it is **not** is web push. A notification that reaches someone whose
 * app is closed needs a service worker, a VAPID key pair, a table of push
 * subscriptions and something server-side to send them — none of which exists
 * here, and none of which can be faked from the sender's device: the sender
 * cannot raise a notification on someone else's phone. That is a piece of work
 * of its own.
 *
 * So this is the honest subset: better than nothing while the app is open,
 * silently absent otherwise, and never pretending the other case is covered.
 * The in-app notification is the mechanism; this is a courtesy on top of it.
 *
 * Permission is never requested from here. Asking the moment someone opens an
 * app is how people learn to say no forever, and the asking belongs somewhere
 * a person has a reason to say yes.
 */

export type DeviceNotifyOutcome = 'shown' | 'not-supported' | 'not-permitted' | 'failed';

export function canNotifyOnThisDevice(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Whether the phone would actually show one right now. */
export function deviceNotifyState(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!canNotifyOnThisDevice()) return 'unsupported';
  return Notification.permission;
}

export function announceOnThisDevice(row: {
  title?: string;
  body?: string | null;
}): DeviceNotifyOutcome {
  if (!canNotifyOnThisDevice()) return 'not-supported';
  if (Notification.permission !== 'granted') return 'not-permitted';

  const title = (row.title ?? '').trim();
  if (!title) return 'failed';

  try {
    /*
     * Tagged by nothing more specific than the app on purpose: two of these
     * arriving together should replace one another rather than stack up. And
     * only what the row already carries is shown — a surprise's row has no
     * title, place or date in it, so there is nothing here that could leak
     * one even by accident.
     */
    new Notification(title, {
      body: row.body ?? undefined,
      icon: '/icon-180.png',
      badge: '/icon-180.png',
      tag: 'couple777',
    });
    return 'shown';
  } catch {
    /* Some browsers only allow this from a service worker. Nothing to do
       about it here, and nothing worth breaking a render over. */
    return 'failed';
  }
}
