import { useState, type ChangeEvent, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface SendLaterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTime: (isoDate: string) => void;
}

export default function SendLaterPopover({
  isOpen,
  onClose,
  onSelectTime,
}: SendLaterPopoverProps) {
  const [customDateTime, setCustomDateTime] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getQuickPickDate = (hours: number = 9): Date => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow
    d.setHours(hours, 0, 0, 0);
    return d;
  };

  const handleQuickPick = (hours: number) => {
    const target = getQuickPickDate(hours);
    onSelectTime(target.toISOString());
    onClose();
  };

  const handleCustomSubmit = () => {
    if (customDateTime) {
      onSelectTime(new Date(customDateTime).toISOString());
      onClose();
    }
  };

  return (
    <div className="absolute top-10 right-0 z-50 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-gray-800 animate-fade-in font-sans">
      <h4 className="text-xs font-bold text-gray-900 mb-3">Send Later</h4>

      {/* "Pick date & time" row with calendar icon */}
      <div className="relative mb-3">
        <label className="text-[11px] font-medium text-gray-500 mb-1 block">
          Pick date &amp; time
        </label>
        <div
          onClick={() => dateInputRef.current?.showPicker?.()}
          className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-gray-100/70 transition-colors"
        >
          <input
            ref={dateInputRef}
            type="datetime-local"
            value={customDateTime}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCustomDateTime(e.target.value)
            }
            className="w-full bg-transparent text-xs text-gray-800 outline-none cursor-pointer"
            min={new Date().toISOString().slice(0, 16)}
          />
          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 pointer-events-none" />
        </div>
      </div>

      {/* Quick Select Presets */}
      <div className="space-y-0.5 py-2 border-t border-b border-gray-100 text-xs">
        <button
          type="button"
          onClick={() => handleQuickPick(9)}
          className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded-md text-gray-700 transition-colors cursor-pointer"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => handleQuickPick(10)}
          className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded-md text-gray-700 transition-colors cursor-pointer"
        >
          Tomorrow, 10:00 AM
        </button>
        <button
          type="button"
          onClick={() => handleQuickPick(11)}
          className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded-md text-gray-700 transition-colors cursor-pointer"
        >
          Tomorrow, 11:00 AM
        </button>
        <button
          type="button"
          onClick={() => handleQuickPick(15)}
          className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded-md text-gray-700 transition-colors cursor-pointer"
        >
          Tomorrow, 3:00 PM
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-2 mt-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-900 font-medium px-2.5 py-1 cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCustomSubmit}
          disabled={!customDateTime}
          className="px-3.5 py-1 rounded-full border border-green-600 text-green-600 font-semibold text-xs hover:bg-green-50 disabled:opacity-40 transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
