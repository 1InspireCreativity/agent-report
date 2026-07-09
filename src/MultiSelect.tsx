import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  className?: string;
}

export default function MultiSelect({ options, selected, onChange, placeholder, className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((item) => item !== opt) : [...selected, opt]);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm cursor-pointer flex justify-between items-center min-h-[36px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selected.length === 0 && <span className="text-slate-400">{placeholder}</span>}
          {selected.map((s) => (
            <span key={s} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs flex items-center">
              {s}
            </span>
          ))}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt}
              className="px-3 py-2 flex items-center gap-2 hover:bg-slate-50 cursor-pointer"
              onClick={() => toggleOption(opt)}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                readOnly
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
