"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/");
      }
    });
  }, [router]);

  async function signIn() {
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace("/");
  }

//   async function signUp() {
//     setLoading(true);
//     setMessage(null);

//     const supabase = createClient();
//     const { error } = await supabase.auth.signUp({ email, password });

//     if (error) {
//       setMessage(error.message);
//       setLoading(false);
//       return;
//     }

//     setMessage("Konto skapat. Du kan nu logga in.");
//     setLoading(false);
//   }

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Logga in</CardTitle>
          <CardDescription>Logga in för att kunna rensa gamla listor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

          <div className="flex gap-3">
            <Button disabled={loading} onClick={signIn}>
              Logga in
            </Button>
            {/* <Button disabled={loading} variant="outline" onClick={signUp}>
              Skapa konto
            </Button> */}
          </div>

          <Button variant="ghost" onClick={() => router.push("/")}>Till startsidan</Button>
        </CardContent>
      </Card>
    </main>
  );
}
