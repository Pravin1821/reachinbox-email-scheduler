import React, { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface BaseProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Text input
interface InputProps extends BaseProps, InputHTMLAttributes<HTMLInputElement> {
  as?: 'input';
}

// Textarea
interface TextareaProps extends BaseProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: 'textarea';
  rows?: number;
}

type Props = InputProps | TextareaProps;

export default function Input(props: Props) {
  const { label, error, hint, leftIcon, rightIcon, as: Tag = 'input', className = '', ...rest } = props;
  const id = (rest as InputHTMLAttributes<HTMLInputElement>).id ?? (rest as InputHTMLAttributes<HTMLInputElement>).name;

  const inputClass = [
    'input-base',
    leftIcon ? 'pl-10' : '',
    rightIcon ? 'pr-10' : '',
    error ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            {leftIcon}
          </span>
        )}
        {Tag === 'textarea' ? (
          <textarea
            id={id}
            className={`${inputClass} resize-none`}
            rows={(props as TextareaProps).rows ?? 4}
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={id}
            className={inputClass}
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!error && hint && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
}
