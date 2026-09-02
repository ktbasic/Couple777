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
      {label ? (
        <label className={s.label} htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
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
      {showCount ? <span className={s.counter}>{len}</span> : null}
    </Wrapper>
  );
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
