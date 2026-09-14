import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
      <h1 className="font-heading text-4xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        That course, chapter, or page does not exist — or it belongs to another teacher.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to courses</Link>
      </Button>
    </div>
  );
}
