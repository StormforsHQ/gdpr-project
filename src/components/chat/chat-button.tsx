"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "./chat-panel";

export function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          size="icon"
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg print:hidden"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}
      <ChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
