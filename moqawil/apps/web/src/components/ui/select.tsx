import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Styled native <select> — the app's forms are plain server-action forms, not client-controlled
 * comboboxes, so a native element (full keyboard/a11y/RTL support for free) is the right level of
 * complexity here rather than a full Radix Select.
 */
export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-10 w-full appearance-none rounded-sm border border-input bg-background bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>\')] bg-[position:right_0.75rem_center] bg-no-repeat rtl:bg-[position:left_0.75rem_center] px-3 py-2 pe-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
