import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Station lookup by name — returns lat/lon coordinates for given station names.
 * Uses the local stops.txt dataset directly (no external dependencies needed).
 *
 * GET /api/stations?names=Rajiv+Chowk,Hauz+Khas
 */

interface StationResult {
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const names = searchParams.get("names");

    if (!names) {
      return NextResponse.json(
        { status: 400, message: "Missing 'names' parameter." },
        { status: 400 }
      );
    }

    const nameList = names.split(",").map((n) => n.trim().toLowerCase());

    // Read and parse stops.txt manually (no csv-parse dependency needed)
    const filePath = path.join(process.cwd(), "public", "stops.txt");
    const fileContent = await readFile(filePath, "utf-8");
    const lines = fileContent.split("\n").filter(Boolean);

    // Skip header row
    const dataLines = lines.slice(1);

    const matchedStations: StationResult[] = [];

    for (const line of dataLines) {
      const cols = line.split(",");
      if (cols.length < 6) continue;

      const stopName = (cols[2] ?? "").trim();
      const lat = parseFloat(cols[4]);
      const lon = parseFloat(cols[5]);

      if (stopName && nameList.includes(stopName.toLowerCase()) && !isNaN(lat) && !isNaN(lon)) {
        matchedStations.push({
          stop_name: stopName,
          stop_lat: lat,
          stop_lon: lon,
        });
      }
    }

    return NextResponse.json({ status: 200, data: matchedStations });
  } catch (error: unknown) {
    console.error("Stations GET Error:", error);
    return NextResponse.json(
      { status: 500, message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
