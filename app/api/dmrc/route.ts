import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { MetroAPI } from "@/lib/metro";
import {
  buildStationIndex,
  parseStopsTxt,
  resolveStationName,
  StationRecord,
} from "@/lib/station-matcher";

// ─── Singleton MetroAPI ───────────────────────────────────────────────────────
const metroApi = new MetroAPI();

// ─── Local stops.txt index (for autocomplete — instant, no backend needed) ────
let _localIndex: StationRecord[] | null = null;

async function getLocalIndex(): Promise<StationRecord[]> {
  if (_localIndex) return _localIndex;
  try {
    const filePath = path.join(process.cwd(), "public", "stops.txt");
    const csv = await readFile(filePath, "utf-8");
    _localIndex = parseStopsTxt(csv);
    console.info(`[DMRC API] Local stop index: ${_localIndex.length} stations from stops.txt`);
  } catch (err) {
    console.error("[DMRC API] Failed to read stops.txt:", err);
    _localIndex = [];
  }
  return _localIndex;
}

// ─── Backend index (for route resolution — canonical names the API accepts) ───
// Built lazily; if the backend is unreachable we fall back to raw user input.
let _backendIndex: StationRecord[] | null = null;
let _backendLoading = false;
let _backendLoadPromise: Promise<StationRecord[]> | null = null;

async function getBackendIndex(): Promise<StationRecord[]> {
  if (_backendIndex) return _backendIndex;
  if (_backendLoading && _backendLoadPromise) return _backendLoadPromise;

  _backendLoading = true;
  _backendLoadPromise = (async () => {
    try {
      const names = await metroApi.getAllStations();
      _backendIndex = names.length > 0 ? buildStationIndex(names) : [];
      console.info(`[DMRC API] Backend index: ${_backendIndex.length} stations`);
    } catch (err) {
      console.error("[DMRC API] Backend index load failed:", err);
      _backendIndex = [];
    }
    _backendLoading = false;
    return _backendIndex!;
  })();

  return _backendLoadPromise;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  try {
    // ── /api/dmrc?type=route ────────────────────────────────────────────────
    if (type === "route") {
      const rawFrom = searchParams.get("from");
      const rawTo   = searchParams.get("to");

      if (!rawFrom || !rawTo) {
        return NextResponse.json(
          { status: 400, message: "Missing 'from' or 'to' parameters." },
          { status: 400 }
        );
      }

      // Resolve against backend index (non-blocking — falls back to raw input)
      const backendIndex = await getBackendIndex();
      const resolvedFrom = resolveStationName(rawFrom, backendIndex) ?? rawFrom;
      const resolvedTo   = resolveStationName(rawTo,   backendIndex) ?? rawTo;

      console.debug(
        `[DMRC API] route — from: "${rawFrom}" → "${resolvedFrom}"  |  to: "${rawTo}" → "${resolvedTo}"`
      );

      const result = await metroApi.getRoute(resolvedFrom, resolvedTo);

      if (result.status !== 200) {
        result.message = metroApi.getErrorByCode(result.status);
      }

      return NextResponse.json(result);
    }

    // ── /api/dmrc?type=stations ─────────────────────────────────────────────
    if (type === "stations") {
      const line = searchParams.get("line") || searchParams.get("value");
      if (!line) {
        return NextResponse.json(
          { status: 400, message: "Missing 'line' or 'value' parameter." },
          { status: 400 }
        );
      }
      const result = await metroApi.getStationsByLine(line);
      return NextResponse.json(result);
    }

    // ── /api/dmrc?type=all-stations ─────────────────────────────────────────
    // Serves local stops.txt — instant response, no backend dependency.
    // The client uses this for autocomplete only; fuzzy resolution on the
    // server bridges any name differences before forwarding to the API.
    if (type === "all-stations") {
      const local = await getLocalIndex();
      if (local.length > 0) {
        const stations = local.map((s) => s.original).sort();
        return NextResponse.json({ status: 200, stations });
      }
      // Fallback: ask backend (stops.txt unreadable)
      const stations = await metroApi.getAllStations();
      return NextResponse.json({ status: 200, stations });
    }

    return NextResponse.json(
      {
        status: 400,
        message:
          "Invalid or missing 'type' parameter. Use 'route', 'stations', or 'all-stations'.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("DMRC Proxy API Error:", error);
    return NextResponse.json(
      {
        status: 500,
        message: "Internal Server Error while communicating with DMRC API.",
      },
      { status: 500 }
    );
  }
}
