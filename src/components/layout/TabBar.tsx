import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '@/context/store';
import { dailyStatus, unreadCount } from '@/lib/selectors';
import { IconExplore, IconHome, IconMemories, IconTalk, IconUs } from './icons';
import s from './TabBar.module.css';

const TABS = [
  { to: '/', label: 'Home', Icon: IconHome, exact: true },
  { to: '/explore', label: 'Explore', Icon: IconExplore },
  { to: '/memories', label: 'Memories', Icon: IconMemories },
  { to: '/talk', label: 'Talk', Icon: IconTalk },
  { to: '/us', label: 'Us', Icon: IconUs },
];

export function TabBar() {
  const { state, me, partner } = useStore();
  const { pathname } = useLocation();

  // One dot on Talk covers everything waiting for you there.
  const daily = dailyStatus(state, me.id, partner.id);
  const talkDot = !daily.answeredByMe || unreadCount(state, me.id) > 0;

  return (
    <nav className={s.bar} aria-label="Main">
      {TABS.map(({ to, label, Icon, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to);
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
            {to === '/talk' && talkDot ? <span className={s.dot} aria-label="Something is waiting" /> : null}
          </NavLink>
        );
      })}
    </nav>
  );
}
