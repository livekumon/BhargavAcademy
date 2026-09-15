import Link from "next/link";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ParentChildNotFound() {
  return (
    <EmptyState
      icon={<UserX />}
      title="We couldn't find that child"
      description="This child isn't linked to your login. If that seems wrong, ask the teacher to check the parent email on your child's profile."
      action={
        <Button asChild>
          <Link href="/parent">Back to my family</Link>
        </Button>
      }
    />
  );
}
