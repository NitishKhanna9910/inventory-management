"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Crumb[];
  className?: string;
}) {
  return (
    <div className={cn("mb-5", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={`${b.label}-${i}`}>
              {i > 0 ? <ChevronRight className="size-3" /> : null}
              {b.href ? (
                <Link href={b.href} className="hover:text-foreground hover:underline">
                  {b.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
