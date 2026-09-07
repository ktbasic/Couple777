import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId } from 'react';
import s from './Field.module.css';

function Wrapper({
  label,
  hint,
  htmlFor,
  children,
}: {
  label?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className={s.field}>
      <div className={s.shell}>
        {label ? (
          <label className={s.label} htmlFor={htmlFor}>
            {label}
          </label>
        ) : null}
        {children}
      </div>
      {hint ? <p className={s.hint}>{hint}</p> : null}
    </div>
  );
}

export function Input({
  label,
  hint,
  ...rest
}: { label?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Wrapper label={label} hint={hint} htmlFor={id}>
      <input id={id} className={s.control} {...rest} />
    </Wrapper>
  );
}

export function Textarea({
  label,
  hint,
  showCount,
  ...rest
}: {
  label?: string;
  hint?: string;
  showCount?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const len = typeof rest.value === 'string' ? rest.value.length : 0;
  return (
    <Wrapper label={label} hint={hint} htmlFor={id}>
      <textarea id={id} className={`${s.control} ${s.textarea}`} {...rest} />
      {/* With a limit set, the count is only useful against it. */}
      {showCount ? (
        <span className={s.counter}>{rest.maxLength ? `${len}/${rest.maxLength}` : len}</span>
      ) : null}
    </Wrapper>
  );
}

/**
 * A short field with an icon and its label stacked inside it.
 *
 * For the three that answer *when* and *where*: a date, a time, a place. The
 * native input is kept — a phone's own date wheel beats anything built here —
 * and only its chrome is taken away, so the row reads as one thing rather than
 * as a browser control dropped into a design.
 */
export function CompactField({
  label,
  icon,
  display,
  placeholder,
  ...rest
}: {
  label: string;
  icon: ReactNode;
  /**
   * What to show instead of the control's own rendering.
   *
   * Only date and time need it, and they need it badly: a native date input
   * draws itself in the browser's locale, so the same plan reads "09/14/2026"
   * on one phone and "14/09/2026" on another, and an empty time renders as
   * "--:-- --", which looks like something broke rather than something to
   * fill in. The input stays exactly where it was and stays the thing you
   * tap — the platform's own wheel is better than anything built here — it is
   * just made invisible, with our text sitting in its place.
   */
  display?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const overlaid = display !== undefined;
  const empty = !rest.value;

  return (
    <div className={s.compact}>
      <span className={s.compactIcon} aria-hidden>
        {icon}
      </span>
      <span className={s.compactBody}>
        <label className={s.compactLabel} htmlFor={id}>
          {label}
        </label>

        {overlaid ? (
          <span className={s.compactStack}>
            <span
              className={[s.compactShown, empty ? s.compactShownEmpty : ''].filter(Boolean).join(' ')}
              aria-hidden
            >
              {display || placeholder}
            </span>
            <input
              id={id}
              className={[s.compactControl, s.compactHidden].join(' ')}
              placeholder={placeholder}
              {...rest}
            />
          </span>
        ) : (
          <input id={id} className={s.compactControl} placeholder={placeholder} {...rest} />
        )}
      </span>
    </div>
  );
}

/** A date beside a time, in the proportion they are actually read. */
export function CompactPair({ children }: { children: ReactNode }) {
  return <div className={s.compactPair}>{children}</div>;
}

export function Select({
  label,
  hint,
  children,
  ...rest
}: { label?: string; hint?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Wrapper label={label} hint={hint} htmlFor={id}>
      <select id={id} className={`${s.control} ${s.select}`} {...rest}>
        {children}
      </select>
    </Wrapper>
  );
}
