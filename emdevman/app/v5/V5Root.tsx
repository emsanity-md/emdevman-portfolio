import "./v5.css";

/**
 * Server-side root for v5, so the same profile tree can render on `/` (when the
 * active design is `v5`) without needing the removed route layout.
 *
 * The fonts live on <html> in the root layout. `--font-inter` was already
 * declared there, and the display face moved there too when the loader became
 * global: the loader sits outside this tree and still needs Anton.
 */
export function V5Root({ children }: { children: React.ReactNode }) {
  return <div className="v5-root">{children}</div>;
}
