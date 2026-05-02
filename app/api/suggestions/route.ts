import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/suggestions — retrieve all community suggestions.
 * Sorted by votes (desc), then creation date (desc).
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("suggestions")
      .select("*")
      .order("votes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ status: 200, data });
  } catch (error: unknown) {
    console.error("Suggestions GET Error:", error);
    return NextResponse.json(
      { status: 500, message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/suggestions — add a new community route suggestion.
 * Note: Authentication is enforced via Supabase RLS policies on the
 * `suggestions` table. The client sends the user's JWT in the
 * Supabase client, which RLS validates.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, full_route, hashtags, tip, user_id, author_name, author_avatar } = body;

    if (!origin || !destination || !full_route) {
      return NextResponse.json(
        { status: 400, message: "Origin, destination, and full_route are required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(full_route) || full_route.length < 2) {
      return NextResponse.json(
        { status: 400, message: "full_route must be an array of at least 2 station names." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("suggestions")
      .insert([
        {
          origin: origin.trim(),
          destination: destination.trim(),
          full_route,
          hashtags: Array.isArray(hashtags) ? hashtags : [],
          tip: typeof tip === "string" ? tip.trim() : "",
          votes: 0,
          user_id: user_id || null,
          author_name: author_name || "COMMUNITY_USER",
          author_avatar: author_avatar || null,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(
      {
        status: 201,
        message: "Suggestion added successfully.",
        data: data?.[0] ?? null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Add Suggestion Error:", error);
    return NextResponse.json(
      { status: 500, message: error instanceof Error ? error.message : "Failed to add suggestion." },
      { status: 500 }
    );
  }
}
