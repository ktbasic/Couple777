import { Screen } from '@/components/layout/Screen';
import { AppIcon } from '@/components/ui/Logo777';
import s from './NeedsSetup.module.css';

/**
 * What a build with no Supabase credentials shows.
 *
 * It would be easy to fall back to the old local-only prototype here, and
 * tempting, because the app would look like it worked. It would not: accounts
 * that are not real, a partner who cannot actually join, and everything gone
 * when the tab closes. Better to say plainly what is missing.
 */
export default function NeedsSetupScreen() {
  return (
    <Screen className={s.screen}>
      <AppIcon tone="on-accent" className={s.icon} />
      <h1 className={s.title}>Couple777 is not connected yet</h1>
      <p className={s.body}>
        This build has no backend credentials, so there is nowhere to keep an account or a
        shared space.
      </p>
      <ol className={s.steps}>
        <li>
          Create a free project at <code>supabase.com</code>.
        </li>
        <li>
          Run <code>supabase/migrations/0001_init.sql</code> in its SQL editor.
        </li>
        <li>
          Copy <code>.env.example</code> to <code>.env.local</code> and paste in the project URL
          and anon key.
        </li>
        <li>Rebuild.</li>
      </ol>
      <p className={s.fine}>
        The full walkthrough is in <code>docs/SUPABASE_SETUP.md</code>.
      </p>
    </Screen>
  );
}
