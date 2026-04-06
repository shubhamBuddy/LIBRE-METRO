import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export async function GET(request: NextRequest) {
    try {
        const filePath = path.join(process.cwd(), "public", "stops.txt");
        const fileContent = fs.readFileSync(filePath, "utf-8");

        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Convert types (stop_id to int, lats/lons to float)
        const stations = records.map((record: any) => ({
            stop_id: parseInt(record.stop_id),
            stop_code: record.stop_code || null,
            stop_name: record.stop_name || null,
            stop_desc: record.stop_desc || null,
            stop_lat: parseFloat(record.stop_lat),
            stop_lon: parseFloat(record.stop_lon),
        }));

        // Upsert stations in chunks to avoid large payload errors
        const CHUNK_SIZE = 50;
        const results = [];
        for (let i = 0; i < stations.length; i += CHUNK_SIZE) {
            const chunk = stations.slice(i, i + CHUNK_SIZE);
            const { data, error } = await supabase
                .from("stations")
                .upsert(chunk, { onConflict: "stop_id" });

            if (error) {
                console.error(`Error inserting chunk ${i}:`, error);
                throw error;
            }
            results.push(data);
        }

        return NextResponse.json({
            status: 200,
            message: `Successfully imported ${stations.length} stations.`,
            count: stations.length
        });

    } catch (error: any) {
        console.error("Import Stops Error:", error);
        return NextResponse.json({
            status: 500,
            message: error.message || "Internal Server Error during stops import."
        }, { status: 500 });
    }
}
