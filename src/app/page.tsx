"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { createClient } from "@/src/lib/supabase/client";

function newListId() {
  // short-ish id for nice URLs (you can switch to crypto.randomUUID() if you prefer)
  return Math.random().toString(36).slice(2, 10);
}

export default function HomePage() {
  const router = useRouter();
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  async function cleanupOldLists() {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("delete_old_lists");
    
    if (error) {
      setCleanupMessage("Failed to cleanup lists");
      console.error(error);
    } else {
      setCleanupMessage(`Deleted ${data} old lists`);
    }
    
    setTimeout(() => setCleanupMessage(null), 3000);
  }

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Grocery Todo</CardTitle>
          <CardDescription>
            Create a list, drag items into store sections, and share the link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={() => {
                const id = newListId();
                router.push(`/l/${id}`);
              }}
            >
              Create new list
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // quick dev shortcut: always go to a fixed list
                router.push(`/l/demo`);
              }}
            >
              Open demo list
            </Button>
          </div>

          <div className="pt-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {cleanupMessage || "Lists older than 30 days can be removed"}
            </span>
            <Button variant="ghost" size="sm" onClick={cleanupOldLists}>
              Cleanup old lists
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
