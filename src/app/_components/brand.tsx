import Link from "next/link";

/** Wordmark + mark. Visible product name is Lists — never a stack name. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
    >
      <rect
        x="1.5"
        y="1.5"
        width="19"
        height="19"
        rx="5"
        className="stroke-primary"
        strokeWidth="1.5"
      />
      <path
        d="M6.5 11.2 9.2 14l6.3-7"
        className="stroke-primary"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLockup({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-ink"
    >
      <BrandMark />
      Lists
    </Link>
  );
}
