import { useState, type KeyboardEvent, type ChangeEvent } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ChipInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  onUploadClick?: () => void;
}

export default function ChipInput({
  value,
  onChange,
  placeholder = 'recipient@example.com',
  onUploadClick,
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addEmail = (raw: string) => {
    const trimmed = raw.trim().replace(/[,;]/g, '');
    if (!trimmed) return;

    // Check if multiple emails separated by space/comma/semicolon were pasted
    const tokens = trimmed.split(/[\s,;]+/).filter(Boolean);
    const validEmails = tokens.filter(
      (t) => EMAIL_REGEX.test(t) && !value.includes(t),
    );

    if (validEmails.length > 0) {
      onChange([...value, ...validEmails]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue) {
      addEmail(inputValue);
    }
  };

  const removeEmail = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  // Limit display to 3 chips, show +N for overflow
  const maxVisible = 3;
  const visibleEmails = value.slice(0, maxVisible);
  const hiddenCount = value.length - maxVisible;

  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-2.5 w-full min-h-[44px]">
      <div className="flex items-center flex-wrap gap-1.5 flex-1 pr-2">
        {visibleEmails.map((email, idx) => (
          <span
            key={email}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-green-700 border border-green-600"
          >
            {email}
            <button
              type="button"
              onClick={() => removeEmail(idx)}
              className="text-green-600 hover:text-green-800 text-xs font-bold leading-none cursor-pointer"
            >
              ×
            </button>
          </span>
        ))}

        {hiddenCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-300">
            +{hiddenCount}
          </span>
        )}

        <input
          type="email"
          value={inputValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setInputValue(e.target.value)
          }
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[180px] bg-transparent text-xs text-gray-900 placeholder-gray-400 outline-none"
        />
      </div>

      {onUploadClick && (
        <button
          type="button"
          onClick={onUploadClick}
          className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 flex-shrink-0 cursor-pointer"
        >
          <span>↑ Upload List</span>
        </button>
      )}
    </div>
  );
}
