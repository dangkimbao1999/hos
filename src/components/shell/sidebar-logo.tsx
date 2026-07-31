import Link from "next/link";
import Image from "next/image";

export function SidebarLogo({ href }: { href: string }) {
  return (
    <Link href={href} className="px-2">
      <Image src="/brand/logo.svg" alt="Heart of Show" width={116} height={35} priority />
    </Link>
  );
}
