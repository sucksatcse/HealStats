import type { ReactNode } from 'react';

interface PageFrameProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function PageFrame({ title, description, children }: PageFrameProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft backdrop-blur">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </header>
      {children}
    </section>
  );
}