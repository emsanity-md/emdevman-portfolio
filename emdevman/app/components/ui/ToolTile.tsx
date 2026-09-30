import type { ReactNode } from "react";

interface ToolTileProps {
  name: string;
  /** The mono uppercase sub-label - proficiency, role, or category. */
  role?: string;
  /**
   * A longer muted line under the name, for the cases where a short mono role
   * would throw away the only real information the entry carries.
   */
  description?: string;
  /** Optional mark in the tile. Falls back to the first letter. */
  mark?: ReactNode;
}

/**
 * One entry in a toolkit list: a small bordered tile, a name at 13px, and a
 * role in mono uppercase. Borrowed from the reference's affiliations row, which
 * is how it lists named things - no card, no tint, no chrome.
 *
 * `mark` takes a real brand glyph where one exists - the toolkit passes a
 * monochrome `BrandMark` - and falls back to a monogram where it does not,
 * rather than inventing a logo.
 */
export default function ToolTile({ name, role, description, mark }: ToolTileProps) {
  return (
    <div className="group inline-flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background font-mono text-[13px] font-medium text-muted-foreground"
      >
        {mark ?? name.charAt(0)}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium leading-snug text-foreground transition-colors group-hover:text-muted-foreground">
          {name}
        </span>
        {role && (
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-faint">
            {role}
          </span>
        )}
        {description && (
          <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </div>
  );
}
