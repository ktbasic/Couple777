import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '@/context/store';
import { dailyStatus, unreadCount } from '@/lib/selectors';
import {
  IconCommunity,
  IconExplore,
  IconHomeSolid,
  IconMemories,
  IconUs,
} from './icons';
import s from './TabBar.module.css';

/**
 * Five destinations with Home in the middle, raised out of the bar.
 *
 * Home is not one of five equal things — it is the screen the app is for, and
 * the other four are where you go when you want something specific. So it gets
 * the centre and the only piece of colour down here, and the bar splits around
 * it rather than making room for a sixth-of-the-width tab.
 */
const LEFT = [
  { to: '/explore', label: 'Explore', Icon: IconExplore },
  { to: '/memories', label: 'Memories', Icon: IconMemories },
];

const RIGHT = [
  { to: '/community', label: 'Community', Icon: IconCommunity },
  { to: '/us', label: 'Us', Icon: IconUs },
];

export function TabBar() {
  const { state, me, partner } = useStore();
  const { pathname } = useLocation();

  /* The conversation lives under Us now, so its dot moved with it. */
  const daily = dailyStatus(state, me.id, partner.id);
  const usDot = !daily.answeredByMe || unreadCount(state, me.id) > 0;

  const tab = (
    { to, label, Icon }: { to: string; label: string; Icon: typeof IconExplore },
    dot?: boolean,
  ) => {
    const active = pathname.startsWith(to);
    return (
      <NavLink
        key={to}
        to={to}
        className={[s.tab, active ? s.on : ''].filter(Boolean).join(' ')}
        aria-current={active ? 'page' : undefined}
      >
        <span className={s.icon}>
          <Icon active={active} />
        </span>
        <span className={s.label}>{label}</span>
        {dot ? <span className={s.dot} aria-label="Something is waiting" /> : null}
      </NavLink>
    );
  };

  const home = pathname === '/';

  return (
    <nav className={s.bar} aria-label="Main">
      <div className={s.side}>{LEFT.map((t) => tab(t))}</div>

      <div className={s.centre}>
        <NavLink
          to="/"
          className={[s.home, home ? s.homeOn : ''].filter(Boolean).join(' ')}
          aria-current={home ? 'page' : undefined}
          aria-label="Home"
        >
          <IconHomeSolid />
        </NavLink>
        <span className={[s.homeLabel, home ? s.homeLabelOn : ''].filter(Boolean).join(' ')}>
          Home
        </span>
      </div>

      <div className={s.side}>{RIGHT.map((t) => tab(t, t.to === '/us' && usDot))}</div>
    </nav>
  );
}
