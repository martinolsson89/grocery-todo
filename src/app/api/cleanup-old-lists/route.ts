import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

export async function POST(request: Request) {
  // Basic same-origin check to reduce CSRF risk
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  if (origin && origin !== requestOrigin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Run the destructive operation server-side using the service role key.
  // This avoids exposing the RPC invocation to anonymous visitors.
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("delete_old_lists");

  if (error) {
    return NextResponse.json(
      { error: "Cleanup failed", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ deletedCount: data ?? 0 });
}
