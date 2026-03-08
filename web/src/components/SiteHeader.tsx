import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  action?: ReactNode;
  title?: string;
  subtitle?: string;
}

export function SiteHeader({ action, title, subtitle }: Props) {
  return (
    <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 px-4 py-4">
        <Link
          to="/"
          className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-300 transition-colors hover:text-blue-200">
          Planning Poker
        </Link>

        {action ? <div className="pt-1">{action}</div> : null}
      </div>

      {title || subtitle ? (
        <div className="mx-auto max-w-5xl px-4 pb-6">
          {title ? <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1> : null}
          {subtitle ? <p className="mt-1 text-slate-400">{subtitle}</p> : null}
        </div>
      ) : null}
    </header>
  );
}
