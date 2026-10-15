/**
 * The résumé PDF.
 *
 * In `public/`, so it is served as a static file rather than bundled - the
 * image optimiser has no business rewriting a document, and a résumé that
 * arrives altered is a résumé nobody sent.
 *
 * `public/` files have no content hash in their URL, so the document cache
 * policy in `next.config.ts` applies: `max-age=0, must-revalidate`. That is the
 * right call here. A year-long immutable header would be better for repeat
 * visits, but it would also mean an updated résumé kept serving the old one to
 * anyone who had already loaded the page. The ETag makes revalidation cheap - a
 * repeat visit is a 304 and no body.
 *
 * Its own module rather than a constant in a component, because the hero's
 * button and the preview modal both need it and a component cannot import from
 * a sibling component without saying more than "it is defined next door".
 */
export const RESUME_PATH = "/assets/images/emmanuel_bitancor_resume.pdf";

/**
 * What the file is called when saved.
 *
 * The `download` attribute's value, not the path - the on-disk name is a slug
 * (`emmanuel_bitancor_resume.pdf`) and a slug is what ends up in someone's
 * Downloads folder if the attribute is left bare.
 */
export const RESUME_FILENAME = "Emmanuel-Bitancor-Resume.pdf";