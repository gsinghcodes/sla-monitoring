"use client";

import { useState } from "react";

import Dashboard from "@/components/dashboard/dashboard";
import AppShell from "@/components/layout/app-shell";

export default function Home() {
  return (
    <AppShell
    >
      <Dashboard/>
    </AppShell>
  );
}