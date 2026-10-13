import { redirect } from "next/navigation";

/**
 * v5 is now a design value (`?design=v5`) rather than a separate route, so this
 * path exists only to keep old shared links working.
 */
export default function V5Page() {
  redirect("/?design=v5");
}