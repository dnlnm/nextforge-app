import Link from "next/link";
import { CircleAlert } from "lucide-react";

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
    <CircleAlert className="size-10 text-fd-muted-foreground" />
    <h1 className="text-2xl font-semibold">Page not found</h1>
    <p className="text-fd-muted-foreground">
      The page you are looking for does not exist.
    </p>
    <Link
      href="/docs"
      className="text-sm font-medium text-fd-primary underline underline-offset-4"
    >
      Back to docs
    </Link>
  </div>
);

export default NotFound;
