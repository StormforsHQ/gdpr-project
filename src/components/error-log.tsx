"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, X } from "lucide-react";

export interface ErrorEntry {
  id: string;
  timestamp: Date;
  source: "scan" | "ai" | "save" | "system";
  message: string;
  detail?: string;
}

interface ErrorLogContextValue {
  errors: ErrorEntry[];
  addError: (source: ErrorEntry["source"], message: string, detail?: string) => void;
  clearErrors: () => void;
  dismissError: (id: string) => void;
}

const ErrorLogContext = createContext<ErrorLogContextValue | null>(null);

export function useErrorLog() {
  const ctx = useContext(ErrorLogContext);
  if (!ctx) throw new Error("useErrorLog must be used within ErrorLogProvider");
  return ctx;
}

let errorCounter = 0;

export function ErrorLogProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);

  const addError = useCallback((source: ErrorEntry["source"], message: string, detail?: string) => {
    setErrors((prev) => [
      { id: `err-${++errorCounter}`, timestamp: new Date(), source, message, detail },
      ...prev,
    ].slice(0, 100));
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <ErrorLogContext.Provider value={{ errors, addError, clearErrors, dismissError }}>
      {children}
    </ErrorLogContext.Provider>
  );
}

const SOURCE_LABELS: Record<ErrorEntry["source"], string> = {
  scan: "Page scan",
  ai: "AI check",
  save: "Save",
  system: "System",
};

interface ErrorLogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ErrorLogDrawer({ open, onOpenChange }: ErrorLogDrawerProps) {
  const { errors, clearErrors, dismissError } = useErrorLog();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Error log
              {errors.length > 0 && (
                <Badge variant="destructive" className="text-xs">{errors.length}</Badge>
              )}
            </SheetTitle>
            {errors.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearErrors}>
                <Trash2 className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          {errors.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No errors recorded
            </div>
          ) : (
            <div className="divide-y">
              {errors.map((err) => (
                <div key={err.id} className="px-6 py-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {SOURCE_LABELS[err.source]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {err.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs">{err.message}</p>
                      {err.detail && (
                        <p className="text-[11px] text-muted-foreground break-all">{err.detail}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => dismissError(err.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
