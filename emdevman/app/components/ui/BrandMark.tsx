import { brandMarks } from "@/app/lib/brand-icons";

/**
 * A brand mark, monochrome.
 *
 * Single path, `fill="currentColor"`, so it takes the colour of whatever it sits
 * in and needs no `hex` of its own. Renders `null` for a name the map does not
 * know, which is what makes the tile's `mark ?? name.charAt(0)` fall back to the
 * monogram.
 */
export default function BrandMark({
  name,
  className = "size-[18px]",
}: {
  name: string;
  className?: string;
}) {
  const mark = brandMarks[name];
  if (!mark) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={mark.path} />
    </svg>
  );
}
