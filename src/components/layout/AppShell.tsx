import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from './TabBar';
import s from './AppShell.module.css';

/**
 * A phone-shaped frame on desktop, edge-to-edge on mobile. The scroll
 * container lives here so the tab bar stays pinned.
 */
export function AppShell({ tabs = true }: { tabs?: boolean }) {
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);

  // Every route change starts at the top, the way a native push does.
  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className={s.frame}>
      <div className={s.app}>
        <main className={s.main} ref={main}>
          <Outlet />
        </main>
        {tabs ? <TabBar /> : null}
      </div>
    </div>
  );
}
