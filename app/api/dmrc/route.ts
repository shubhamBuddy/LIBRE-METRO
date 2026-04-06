import { NextRequest, NextResponse } from "next/server";
import { MetroAPI } from "@/lib/metro";

const metroApi = new MetroAPI();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  try {
    if (type === "route") {
      const from = searchParams.get("from");
      const to = searchParams.get("to");

      if (!from || !to) {
        return NextResponse.json({ status: 400, message: "Missing 'from' or 'to' parameters." }, { status: 400 });
      }

      const result = await metroApi.getRoute(from, to);
      
      // Map API status codes to user-friendly error messages
      if (result.status !== 200) {
        result.message = metroApi.getErrorByCode(result.status);
      }
      
      return NextResponse.json(result);
    } 
    
    if (type === "stations") {
      const line = searchParams.get("line") || searchParams.get("value");
      if (!line) {
        return NextResponse.json({ status: 400, message: "Missing 'line' or 'value' parameter." }, { status: 400 });
      }

      const result = await metroApi.getStationsByLine(line);
      return NextResponse.json(result);
    }

    if (type === "all-stations") {
      const stations = await metroApi.getAllStations();
      return NextResponse.json({ status: 200, stations });
    }

    return NextResponse.json({ status: 400, message: "Invalid or missing 'type' parameter. Use 'route', 'stations', or 'all-stations'." }, { status: 400 });

  } catch (error) {
    console.error("DMRC Proxy API Error:", error);
    return NextResponse.json({ status: 500, message: "Internal Server Error while communicating with DMRC API." }, { status: 500 });
  }
}
