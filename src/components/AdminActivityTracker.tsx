'use client';

import { useEffect } from 'react';

const COOKIE_NAME = 'admin_last_active';
const UPDATE_INTERVAL_MS = 30 * 1000; // refresh every 30s while active
const COOKIE_MAX_AGE_SEC = 60 * 60; // 1 hour max-age; proxy enforces idle threshold independently

function writeLastActive(ts: number) {
  try {
    document.cookie = `${COOKIE_NAME}=${ts}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export default function AdminActivityTracker() {
  useEffect(() => {
    const update = () => writeLastActive(Date.now());
    update();
    const onActivity = () => update();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') update();
    };

    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('focus', onActivity);
    document.addEventListener('visibilitychange', onVisibility);
    const id = window.setInterval(update, UPDATE_INTERVAL_MS);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('focus', onActivity);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
