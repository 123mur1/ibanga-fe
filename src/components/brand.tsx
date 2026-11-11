import Image from "next/image";
import Link from "next/link";
import ibangaLogo from "./common/iBanga Logistics Logo.png";

export function LogoMark({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`} aria-hidden="true">
      <Image
        src={ibangaLogo}
        alt=""
        fill
        sizes="56px"
        className="object-cover object-left"
      />
    </span>
  );
}

export function BrandLink({
  href = "/",
  light = false,
}: {
  href?: string;
  light?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Image
        src={ibangaLogo}
        alt="iBanga — Connect, Book, Transport"
        width={1774}
        height={887}
        className={`h-16 w-32 shrink-0 object-contain sm:h-[4.5rem] sm:w-36 ${
          light ? "rounded-[9px] ring-1 ring-white/50" : ""
        }`}
        priority
      />
    </Link>
  );
}
