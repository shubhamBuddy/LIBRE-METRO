import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET requests to retrieve all stations.
 */
export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabase
            .from("stations")
            .select("*")
            .order("stop_id", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ status: 200, data });
    } catch (error: any) {
        return NextResponse.json({ status: 500, message: error.message }, { status: 500 });
    }
}

/**
 * POST requests to add a single station.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon } = body;

        if (!stop_id || !stop_name || !stop_lat || !stop_lon) {
            return NextResponse.json({ status: 400, message: "Missing required fields (stop_id, stop_name, stop_lat, stop_lon)." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("stations")
            .insert([{
                stop_id,
                stop_code,
                stop_name,
                stop_desc,
                stop_lat,
                stop_lon
            }])
            .select();

        if (error) throw error;

        return NextResponse.json({
            status: 201,
            message: "Station added successfully.",
            data: data[0]
        }, { status: 201 });

    } catch (error: any) {
        console.error("Add Station Error:", error);
        return NextResponse.json({
            status: 500,
            message: error.message || "Failed to add station."
        }, { status: 500 });
    }
}
