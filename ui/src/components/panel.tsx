import React from "react";
import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-[5px] border border-dusk-90">
      <header className="flex items-start justify-between gap-4 border-b border-dusk-90 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-dusk-30">{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
