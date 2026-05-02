import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Import all stations from stops.txt into Supabase.
 * This is a one-time utility route — only works with a service role key.
 *
 * GET /api/import-stops
 */
export async function GET() {
  try {
    // Require service role key for this admin operation
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { status: 403, message: "Missing SUPABASE_SERVICE_ROLE_KEY — this route requires admin access." },
        { status: 403 }
      );
    }

    // Lazy import to avoid bundling supabase in every API route
    const { getSupabaseServiceRole } = await import("@/lib/supabase");
    const supabaseAdmin = getSupabaseServiceRole();

    const filePath = path.join(process.cwd(), "public", "stops.txt");
    const fileContent = await readFile(filePath, "utf-8");
    const lines = fileContent.split("\n").filter(Boolean);

    // Skip header
    const dataLines = lines.slice(1);

    const stations = dataLines
      .map((line) => {
        const cols = line.split(",");
        if (cols.length < 6) return null;
        const stop_id = parseInt(cols[0]);
        const stop_code = (cols[1] ?? "").trim() || null;
        const stop_name = (cols[2] ?? "").trim() || null;
        const stop_desc = (cols[3] ?? "").trim() || null;
        const stop_lat = parseFloat(cols[4]);
        const stop_lon = parseFloat(cols[5]);
        if (isNaN(stop_id) || isNaN(stop_lat) || isNaN(stop_lon)) return null;
        return { stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon };
      })
      .filter(Boolean);

    // Upsert in chunks
    const CHUNK_SIZE = 50;
    for (let i = 0; i < stations.length; i += CHUNK_SIZE) {
      const chunk = stations.slice(i, i + CHUNK_SIZE);
      const { error } = await supabaseAdmin
        .from("stations")
        .upsert(chunk, { onConflict: "stop_id" });

      if (error) {
        console.error(`Error inserting chunk ${i}:`, error);
        throw error;
      }
    }

    return NextResponse.json({
      status: 200,
      message: `Successfully imported ${stations.length} stations.`,
      count: stations.length,
    });
  } catch (error: unknown) {
    console.error("Import Stops Error:", error);
    return NextResponse.json(
      { status: 500, message: error instanceof Error ? error.message : "Internal Server Error during stops import." },
      { status: 500 }
    );
  }
}
