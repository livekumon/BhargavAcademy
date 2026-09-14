import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardNotFound() {
  return (
    <EmptyState
      icon={<SearchX />}
      title="We couldn't find that"
      description="It may have been deleted, or it belongs to another teacher. Use search (⌘K) to jump to what you need."
      action={
        <Button asChild size="lg">
          <Link href="/dashboard">Back to Today</Link>
        </Button>
      }
    />
  );
}
