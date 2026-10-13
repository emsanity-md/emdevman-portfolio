"use client";

import { V5Calendar } from "../V5Calendar";
import { V5Post } from "../V5Post";

/**
 * The Activity tab: the contribution calendar, and nothing else.
 *
 * That is the whole tab, deliberately. The brief is explicit about it - no post
 * list, no timeline, no streaks or repo cards - and the reason holds up on its
 * own terms: a contribution calendar answers "does he still ship", which is the
 * one question a static portfolio cannot, and it is undermined rather than helped
 * by being one card among six.
 *
 * The calendar is wrapped in a `V5Post` so the tab is still a feed of posts like
 * the other five, rather than the one panel on the page that breaks the rhythm.
 * A profile page whose Activity tab looks structurally different from its Projects
 * tab reads as a mistake, and the reader has to work out whether it is one.
 *
 * The inner `<article>` the calendar already renders becomes a card-in-a-card
 * here, which is the one place this composition stacks two borders. That is
 * fine: the outer one is the post's, the inner one is the calendar's, and the
 * 3px difference in radius tells them apart.
 */
export function V5ActivityPanel() {
  return (
    <V5Post>
      <V5Calendar />
    </V5Post>
  );
}