"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function TopNavbar() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="flex h-14 items-center justify-end border-b px-4 pl-14 md:pl-4 gap-1">
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
