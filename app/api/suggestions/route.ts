import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET requests to retrieve all suggestions.
 */
export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabase
            .from("suggestions")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ status: 200, data });
    } catch (error: any) {
        return NextResponse.json({ status: 500, message: error.message }, { status: 500 });
    }
}

/**
 * POST requests to add a new suggestion.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { origin, destination, full_route, hashtags } = body;

        if (!origin || !destination || !full_route) {
            return NextResponse.json({ status: 400, message: "Origin, destination, and full_route are required." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("suggestions")
            .insert([{
                origin,
                destination,
                full_route,
                hashtags: hashtags || [],
                upvotes: 0,
                downvotes: 0
            }])
            .select();

        if (error) throw error;

        return NextResponse.json({
            status: 201,
            message: "Suggestion added successfully.",
            data: data[0]
        }, { status: 201 });

    } catch (error: any) {
        console.error("Add Suggestion Error:", error);
        return NextResponse.json({
            status: 500,
            message: error.message || "Failed to add suggestion."
        }, { status: 500 });
    }
}
