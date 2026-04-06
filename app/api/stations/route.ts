import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET requests to retrieve all stations.
 */
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const names = searchParams.get("names");

        if (!names) {
            return NextResponse.json({ status: 400, message: "Missing 'names' parameter." }, { status: 400 });
        }

        const nameList = names.split(",").map(n => n.trim().toLowerCase());

        // Read stops.txt directly
        const filePath = path.join(process.cwd(), "public", "stops.txt");
        const fileContent = fs.readFileSync(filePath, "utf-8");

        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Filter records that match our nameList
        const matchedStations = records.filter((r: any) => 
            nameList.includes(r.stop_name.toLowerCase())
        ).map((r: any) => ({
            stop_name: r.stop_name,
            stop_lat: parseFloat(r.stop_lat),
            stop_lon: parseFloat(r.stop_lon)
        }));

        return NextResponse.json({ status: 200, data: matchedStations });
    } catch (error: any) {
        console.error("Stations GET Error:", error);
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
