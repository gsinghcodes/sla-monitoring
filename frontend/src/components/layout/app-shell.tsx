"use client";

import { useState, type ReactNode } from "react";
import Navbar from "./navbar";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({
  children,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navbar
        onMenuClick={() => setMobileNavOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}