"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { createClient } from "@/src/lib/supabase/client";

function newListId() {
  // Use crypto for better randomness and longer ID
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
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

  async function deleteAllLists() {
    const confirmed = window.confirm(
      "Är du säker på att du vill ta bort ALLA listor? Detta kan inte ångras."
    );
    
    if (!confirmed) return;

    const supabase = createClient();
    const { data, error } = await supabase.rpc("delete_all_lists");
    
    if (error) {
      setCleanupMessage("Failed to delete all lists");
      console.error("Delete all error:", error.message, error.code, error.details);
    } else {
      setCleanupMessage(`Deleted ${data} lists`);
    }
    
    setTimeout(() => setCleanupMessage(null), 3000);
  }

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Inköpslista</CardTitle>
          <CardDescription>
            Skapa en lista, lägg till varor i rätt ordning, dela listan.
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
              Skapa en ny lista
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                router.push(`/l/demo`);
              }}
            >
              Öppna Demolista
            </Button>
          </div>

          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {cleanupMessage || "Listor som är äldre än 30 dagar kan tas bort"}
              </span>
              <Button variant="ghost" size="sm" onClick={cleanupOldLists}>
                Rensa gamla listor
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Ta bort alla listor från databasen
              </span>
              <Button variant="destructive" size="sm" onClick={deleteAllLists}>
                Ta bort alla
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
