"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/help-drawer";
import { Sun, Moon, Settings } from "lucide-react";

export function TopNavbar() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="flex h-14 items-center justify-end border-b px-4 pl-14 md:pl-4 gap-1 print:hidden">
      <HelpButton />
      <Link href="/settings">
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        suppressHydrationWarning
      >
        <Sun className="h-5 w-5 hidden dark:block" />
        <Moon className="h-5 w-5 block dark:hidden" />
      </Button>
    </header>
  );
}
