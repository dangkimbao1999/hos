import type { SVGProps } from "react";

/**
 * Hand-drawn monochrome brand glyphs (lucide-react ships no brand icons).
 * Purely decorative footer marks — not pixel-matched to any official logo asset.
 */

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14 13.5h2.5l.4-3H14V8.7c0-.87.24-1.46 1.48-1.46H17V4.6c-.26-.04-1.16-.11-2.2-.11-2.18 0-3.67 1.33-3.67 3.77V10.5H8.6v3H11.13V21h2.87v-7.5Z" />
    </svg>
  );
}

export function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21 6.4c-.65.3-1.35.5-2.08.6a3.6 3.6 0 0 0 1.58-2 7.2 7.2 0 0 1-2.29.87 3.6 3.6 0 0 0-6.14 3.28A10.22 10.22 0 0 1 4.9 5.16a3.6 3.6 0 0 0 1.11 4.8c-.58-.02-1.13-.18-1.6-.44v.04a3.6 3.6 0 0 0 2.88 3.53c-.53.14-1.1.17-1.65.06a3.6 3.6 0 0 0 3.36 2.5A7.24 7.24 0 0 1 3 17.05a10.2 10.2 0 0 0 5.53 1.62c6.63 0 10.26-5.5 10.26-10.26l-.01-.47A7.3 7.3 0 0 0 21 6.4Z" />
    </svg>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.7" />
      <circle cx="17.1" cy="6.9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.94 8.5H4.02V20h2.92V8.5ZM5.48 3.6a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM20 20h-2.92v-5.9c0-1.4-.5-2.36-1.75-2.36-.96 0-1.53.65-1.78 1.27-.09.22-.11.53-.11.84V20H10.5s.04-10.36 0-11.5h2.92v1.63c.39-.6 1.08-1.45 2.63-1.45 1.92 0 3.36 1.25 3.36 3.95V20Z" />
    </svg>
  );
}
