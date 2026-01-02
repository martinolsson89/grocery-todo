"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

function newListId() {
  // short-ish id for nice URLs (you can switch to crypto.randomUUID() if you prefer)
  return Math.random().toString(36).slice(2, 10);
}

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Grocery Todo</CardTitle>
          <CardDescription>
            Create a list, drag items into store sections, and share the link.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
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
        </CardContent>
      </Card>
    </main>
  );
}
