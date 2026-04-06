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

    return NextResponse.json({ status: 400, message: "Invalid or missing 'type' parameter. Use 'route' or 'stations'." }, { status: 400 });

  } catch (error) {
    console.error("DMRC Proxy API Error:", error);
    return NextResponse.json({ status: 500, message: "Internal Server Error while communicating with DMRC API." }, { status: 500 });
  }
}
