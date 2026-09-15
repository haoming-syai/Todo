export function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 4.5h10M6 4.5V3.2A.7.7 0 0 1 6.7 2.5h2.6a.7.7 0 0 1 .7.7v1.3M6.2 13.5h3.6c.8 0 1.4-.6 1.5-1.4l.4-6.6H4.3l.4 6.6c.1.8.7 1.4 1.5 1.4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconImage({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <rect
        x="2.2"
        y="2.2"
        width="11.6"
        height="11.6"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="6" cy="6.2" r="1.1" fill="currentColor" />
      <path
        d="M3.2 12.2 7 8.6l2.2 2.2 1.5-1.5 2.1 2.9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPeople({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle cx="6" cy="5.4" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2.4 13c.3-2.1 1.8-3.3 3.6-3.3s3.3 1.2 3.6 3.3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle
        cx="11.2"
        cy="6"
        r="1.6"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M10.4 13c.3-1.5 1.2-2.4 2.5-2.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M8 3.2v9.6M3.2 8h9.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconGoogle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M15.5 8.18c0-.57-.05-1.12-.15-1.64H8.16v3.11h4.13a3.53 3.53 0 0 1-1.53 2.32v1.92h2.47c1.45-1.33 2.27-3.3 2.27-5.71Z"
      />
      <path
        fill="#34A853"
        d="M8.16 15.5c2.07 0 3.81-.68 5.08-1.85l-2.47-1.92c-.69.46-1.57.73-2.61.73-2 0-3.7-1.35-4.3-3.17H1.3v2c1.26 2.5 3.85 4.21 6.86 4.21Z"
      />
      <path
        fill="#FBBC05"
        d="M3.86 9.29a4.4 4.4 0 0 1 0-2.58V4.71H1.3a7.34 7.34 0 0 0 0 6.58l2.56-2Z"
      />
      <path
        fill="#EA4335"
        d="M8.16 3.54c1.13 0 2.14.39 2.94 1.15l2.2-2.2A7.3 7.3 0 0 0 8.16.5C5.15.5 2.56 2.21 1.3 4.71l2.56 2c.6-1.82 2.3-3.17 4.3-3.17Z"
      />
    </svg>
  );
}
