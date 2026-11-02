import { Link } from "../lib/router";

export function NotFoundPage() {
  return (
    <div className="empty">
      <h1>Page not found</h1>
      <p>That page doesn't exist on MotionShelf.</p>
      <Link href="/browse" className="btn">Back to browse</Link>
    </div>
  );
}
