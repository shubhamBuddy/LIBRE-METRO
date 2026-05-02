/**
 * Metro API Wrapper
 * 
 * Provides a type-safe interface for the Delhi Metro Shortest Path API.
 * Aligned with the Netlify Functions backend (try backend/delhi-metro-netlify).
 *
 * Backend endpoints:
 *   GET /route?from=StationA&to=StationB  → shortest path
 *   GET /route/stations                   → list all stations
 */

export interface MetroRouteResponse {
  status: number;
  line1?: string[];
  line2?: string[];
  interchange?: string[];
  lineEnds?: string[];
  path?: string[];
  time?: number;
  message?: string;
  error?: string;
  mode?: "fastest" | "comfort";
  interchangeCount?: number;
  pathCoords?: { station: string; lat: number | null; lon: number | null }[];
}

export type MetroLine = 
  | 'blue' | 'yellow' | 'magenta' | 'violet' | 'red' 
  | 'green' | 'pink' | 'orange' | 'aqua' | 'grey' | 'rapid'
  | 'bluebranch' | 'greenbranch' | 'pinkbranch';

export const METRO_LINES: MetroLine[] = [
  'blue', 'yellow', 'magenta', 'violet', 'red',
  'green', 'pink', 'orange', 'aqua', 'grey', 'rapid'
];

// Color mapping for metro lines (includes branch variants)
export const LINE_COLORS: Record<string, string> = {
  blue: '#0052A5',
  bluebranch: '#0052A5',
  yellow: '#FFCB05',
  magenta: '#CC0066',
  violet: '#7B1FA2',
  red: '#E53935',
  green: '#388E3C',
  greenbranch: '#388E3C',
  pink: '#E91E63',
  pinkbranch: '#E91E63',
  orange: '#EF6C00',
  aqua: '#00ACC1',
  grey: '#757575',
  rapid: '#EF6C00',
  '1.2km Skywalk': '#9E9E9E',
};

// ─── Name Mapping: stops.txt → backend canonical names ──────────────────────
// The backend JSON files use slightly different station names than stops.txt.
// This map bridges the gap so fuzzy-resolved stops.txt names get translated
// to the exact string the backend's Dijkstra graph understands.
export const STOPS_TO_BACKEND_MAP: Record<string, string> = {
  // Spacing differences
  "Seelam Pur": "Seelampur",
  "Pitampura": "Pitam Pura",
  "Vishwavidyalaya": "Vishwa Vidyalaya",
  "Mansrover park": "Mansarovar Park",
  "Shyam Park": "Shyam park",

  // Spelling differences
  "Netaji Subash Place": "Netaji Subhash Place",
  "Qutab Minar": "Qutub Minar",
  "Chhattarpur": "Chhatarpur",
  "Kanhaiya Nagar": "Kanhiya Nagar",
  "Subash Nagar": "Subhash Nagar",
  "Lal Quila": "Lal Qila",
  "Sikanderpur": "Sikandarpur",
  "Gurudronacharya": "Guru Dronacharya",
  "Old Faridabad": "Faridabad Old",

  // Punctuation / formatting differences
  "Dwarka Sector - 8": "Dwarka Sector 8",
  "Dwarka Sector - 9": "Dwarka Sector 9",
  "Dwarka Sector - 10": "Dwarka Sector 10",
  "Dwarka Sector - 11": "Dwarka Sector 11",
  "Dwarka Sector - 12": "Dwarka Sector 12",
  "Dwarka Sector - 13": "Dwarka Sector 13",
  "Dwarka Sector - 14": "Dwarka Sector 14",
  "Dwarka Sector - 21": "Dwarka Sector 21",
  "Paschim Vihar (East)": "Paschim Vihar East",
  "Paschim Vihar (West)": "Paschim Vihar West",
  "Maujpur - Babarpur": "Maujpur-Babarpur",
  "Jasola-Apollo": "Jasola Apollo",
  "Noida Sec -15": "Noida Sector 15",
  "Noida Sec -16": "Noida Sector 16",
  "Noida Sec -18": "Noida Sector 18",
  "Noida Sec-34": "Noida Sector 34",
  "Noida Sec-52": "Noida Sector 52",
  "Noida Sec-59": "Noida Sector 59",
  "Noida Sec-61": "Noida Sector 61",
  "Noida Sec-62": "Noida Sector 62",
  "Sector-28": "Sector 28",
  "Mundka Industrial Area (M.I.A)": "Mundka Industrial Area",
  "Sant Surdas (Sihi)": "Sant Surdas",
  "Shaheed Sthal (New Bus Adda)": "Shaheed Sthal",
  "Mayur Vihar-I": "Mayur Vihar – I",
  "Mayur Vihar Ext": "Mayur Vihar Extension",
  "Mayur Vihar Pocket 1": "Mayur Vihar Pocket I",
  "Nangloi Railway Station": "Nangloi Railway station",

  // Full name → backend short name
  "Delhi Cantt.": "Delhi Cantonment",
  "Huda City Centre": "HUDA City Centre",
  "Guru Tegh Bahadur Nagar": "GTB Nagar",
  "Haiderpur Badli Mor": "Haiderpur",
  "Harkesh Nagar Okhla": "Harkesh Nagar",
  "Hindon River": "Hindon",
  "Dilli Haat - INA": "INA",
  "Jafrabad": "Jaffrabad",
  "Janak Puri East": "Janakpuri East",
  "Janak Puri West": "Janakpuri West",
  "Jawahar Lal Nehru Stadium": "Jawaharlal Nehru Stadium",
  "Jorbagh": "Jor Bagh",
  "Major Mohit Sharma Rajender Nagar": "Major Mohit Sharma",
  "Badarpur Border": "Badarpur",
  "Badkal Mor": "Badkhal Mor",
  "Barakhamba": "Barakhambha Road",
  "Tughlakabad Station": "Tughlakabad",
  "Sarai Kale Khan - Nizamuddin": "Hazrat Nizamuddin",
  "ESI Basai Darapur": "ESI Hospital",
  "IGI Airport": "Airport",
  "Terminal 1- IGI Airport": "Terminal 1 IGI Airport",
  "Maharaja Surajmal Stadium": "Surajmal Stadium",
  "RK Ashram Marg": "Ramakrishna Ashram Marg",
  "RK Puram": "Sir Vishweshwaraiah Moti Bagh",
  "Rohini Sector 18-19": "Rohini Sector 18",
  "Sadar Bazar Contonment": "Delhi Cantonment",
  "Vasant Vihar": "Sir Vishweshwaraiah Moti Bagh",

  // Magenta line stops.txt → backend name translations (English only)
  "IIT": "IIT Delhi",
  "Dabri Mor - Janakpuri South": "Dabri Mor",
};

export interface MetroStationListResponse {
  status: number;
  stations?: string[];
  total?: number;
  message?: string;
}

export class MetroAPI {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_METRO_API_URL || process.env.API || "http://localhost:3000") {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Standardizes station names:
   * 1. Trim whitespace.
   * 2. Map stops.txt name → backend canonical name if known.
   */
  private standardizeStationName(name: string): string {
    const trimmed = name.trim();
    return STOPS_TO_BACKEND_MAP[trimmed] || trimmed;
  }

  private async apiFetch(url: string): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error(`Received HTML instead of JSON. The API endpoint may be down or returning an error page. URL: ${url}`);
    }
    
    return response;
  }

  /**
   * Fetches the shortest route between two stations.
   * Backend endpoint: GET /route?from=X&to=Y
   */
  async getRoute(from: string, to: string, mode: "fastest" | "comfort" = "fastest"): Promise<MetroRouteResponse> {
    const standardizedFrom = this.standardizeStationName(from);
    const standardizedTo = this.standardizeStationName(to);

    if (!standardizedFrom || !standardizedTo) {
      return { status: 400, message: "Source and destination stations are required." };
    }

    try {
      const url = new URL(`${this.baseUrl}/route`);
      url.searchParams.append("from", standardizedFrom);
      url.searchParams.append("to", standardizedTo);
      if (mode === "comfort") url.searchParams.append("mode", "comfort");

      console.debug(`[MetroAPI] getRoute (${mode}): ${standardizedFrom} → ${standardizedTo}`);

      const response = await this.apiFetch(url.toString());
      const data = await response.json();

      if (data.error) {
        return { status: 404, message: data.error };
      }

      return {
        status: 200,
        path: data.path,
        time: data.time,
        line1: data.line1 || [],
        line2: data.line2 || [],
        interchange: data.interchange || [],
        lineEnds: data.lineEnds || [],
        mode: data.mode || mode,
        interchangeCount: data.interchangeCount ?? data.interchange?.length ?? 0,
        pathCoords: data.pathCoords || [],
      };
    } catch (error) {
      console.error("MetroAPI Error (getRoute):", error);
      return { status: 500, message: "Failed to connect to the Metro API." };
    }
  }

  /**
   * Retrieves ALL station names from the backend.
   * Backend endpoint: GET /route/stations  OR  GET /route?action=stations
   */
  async getAllStations(): Promise<string[]> {
    try {
      // Try the /route/stations endpoint first
      const url = `${this.baseUrl}/route/stations`;
      console.debug(`[MetroAPI] getAllStations: ${url}`);

      const response = await this.apiFetch(url);
      const data = await response.json();

      if (data.stations && Array.isArray(data.stations)) {
        return data.stations;
      }

      // Fallback: try query param
      const fallbackUrl = `${this.baseUrl}/route?action=stations`;
      const fallbackRes = await this.apiFetch(fallbackUrl);
      const fallbackData = await fallbackRes.json();
      if (fallbackData.stations && Array.isArray(fallbackData.stations)) {
        return fallbackData.stations;
      }

      return [];
    } catch (error) {
      console.error("MetroAPI Error (getAllStations):", error);
      return [];
    }
  }

  /**
   * Retrieves stations for a specific metro line.
   * Note: The Netlify backend doesn't have a per-line endpoint.
   * This filters from the full station list instead.
   * @deprecated Use getAllStations() instead.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getStationsByLine(_line: MetroLine | string): Promise<MetroStationListResponse> {
    try {
      const allStations = await this.getAllStations();
      // Since backend doesn't support per-line queries, return all stations
      return { status: 200, stations: allStations };
    } catch (error) {
      console.error("MetroAPI Error (getStationsByLine):", error);
      return { status: 500, message: "Failed to connect to the Metro API." };
    }
  }

  /**
   * Helper to translate API status codes to user-friendly messages.
   */
  getErrorByCode(status: number): string {
    switch (status) {
      case 204: return "Source and destination are the same station.";
      case 400: return "Missing parameters.";
      case 404: return "Station not found. Please check the name.";
      case 4061: return "Invalid source station name.";
      case 4062: return "Invalid destination station name.";
      case 406: return "Both source and destination stations are invalid.";
      case 500: return "Server error — connection failed.";
      default: return "An unexpected error occurred.";
    }
  }
}

// Export a singleton instance
export const metroApi = new MetroAPI();
