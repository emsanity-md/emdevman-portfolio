import type { ReactNode } from "react";

/**
 * One label/value row, and the stack that holds them.
 *
 * v1's only repeated component. There is no hover state and no transition: the
 * row is text either way, and a tint on hover would be the one piece of
 * decoration the design otherwise has none of.
 */
export function V1Rows({ children }: { children: ReactNode }) {
  return <div className="v1-rows">{children}</div>;
}

export function V1Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="v1-row">
      <span className="v1-label v1-row-key">{label}</span>
      <span className="v1-row-value text-[0.9375rem] text-foreground">{children}</span>
    </div>
  );
}
