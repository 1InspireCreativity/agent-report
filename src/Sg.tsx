import { useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
  icon: string;
  iconBg: string;
  title: string;
  status: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function Sg({ icon, iconBg, title, status, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sg">
      <div className={`sg-head ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}>
        <div className="sg-icon-wrap" style={{ background: iconBg }}>
          {icon}
        </div>
        <span className="sg-title">{title}</span>
        <span className="sg-status ok">{status}</span>
        <svg className="sg-chevron" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      <div className={`sg-body ${open ? 'open' : ''}`}>{children}</div>
    </div>
  );
}
