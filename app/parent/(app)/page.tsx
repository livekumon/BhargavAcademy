import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { ActivityFeed } from "@/components/parent/activity-feed";
import { AttentionList } from "@/components/parent/attention-list";
import { ChildCard } from "@/components/parent/child-card";
import { WelcomeCard } from "@/components/parent/welcome-card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireParent } from "@/lib/auth";
import {
  activityFor,
  childSentence,
  firstName,
  greeting,
  outstandingWork,
} from "@/lib/parent-insights";
import { parentChildPath } from "@/lib/paths";
import { getParentFamily } from "@/lib/queries";

export const metadata: Metadata = {
  title: "My family",
};

export default async function ParentHomePage() {
  const parent = await requireParent();
  const family = await getParentFamily(parent.id);

  // Most families have one child at the academy: skip straight to them.
  if (family.length === 1) {
    redirect(parentChildPath(family[0].student.id));
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });
  const openTotal = family.reduce(
    (sum, child) => sum + outstandingWork(child.materials).total,
    0,
  );

  return (
    <div className="space-y-10">
      <header className="animate-rise space-y-3">
        <p className="text-sm font-medium text-brand">{today}</p>
        <h1 className="text-display-3 font-semibold text-balance">
          {greeting()}, {firstName(parent.name)}
        </h1>
        {family.length > 0 ? (
          <p className="max-w-3xl text-lead text-content-muted text-pretty">
            {family.map((child, index) => (
              <span key={child.student.id}>
                {index > 0 ? " " : null}
                <span className="font-medium text-content">{firstName(child.student.name)}</span>{" "}
                {childSentence(child)}
              </span>
            ))}
          </p>
        ) : null}
      </header>

      <WelcomeCard />

      {family.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No children linked yet"
          description="When the academy links your child to this login, their progress will appear here. If you expected to see someone, ask the teacher to check the email on your child's profile."
        />
      ) : (
        <>
          <section aria-labelledby="children-heading" className="space-y-4">
            <h2 id="children-heading" className="text-title-1 font-semibold">
              Your children
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {family.map((child, index) => (
                <div
                  key={child.student.id}
                  className="animate-rise"
                  style={{ animationDelay: `${80 + index * 70}ms` }}
                >
                  <ChildCard child={child} index={index} />
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8">
            <section aria-labelledby="attention-heading" className="space-y-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="attention-heading" className="text-title-1 font-semibold">
                  Needs attention
                </h2>
                {openTotal > 0 ? (
                  <span className="tabular text-sm text-content-muted">{openTotal} open</span>
                ) : null}
              </div>
              <AttentionList items={family} showChild />
            </section>

            <section aria-labelledby="activity-heading" className="space-y-4">
              <h2 id="activity-heading" className="text-title-1 font-semibold">
                Recent activity
              </h2>
              <ActivityFeed events={activityFor(family, 8)} showChild />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
