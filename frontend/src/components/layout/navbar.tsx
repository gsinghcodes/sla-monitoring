"use client";

import {
  Cloud,
  Menu,
} from "lucide-react";
import Image from "next/image";

type NavbarProps = {
  onMenuClick: () => void;
};

export default function Navbar({
  onMenuClick,
}: NavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md">
          <Image
            src="/icon.png"
            alt="SLA Monitoring"
            width={32}
            height={32}
            className="h-8 w-8 object-cover"
          />
        </div>

        <span className="text-sm font-semibold">
          SLA Monitoring
        </span>
      </div>

      <div className="ml-auto">
        <div className="hidden text-xs text-muted-foreground sm:block">
          Made with 🫶 for EarthRe
        </div>
      </div>
    </header>
  );
}