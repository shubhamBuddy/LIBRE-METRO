/**
 * Metro API Wrapper
 * 
 * Provides a type-safe interface for the Delhi Metro Shortest Path API.
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
}

export type MetroLine = 
  | 'blue' | 'yellow' | 'magenta' | 'violet' | 'red' 
  | 'green' | 'pink' | 'orange' | 'aqua' | 'grey' | 'rapid';

export const METRO_LINES: MetroLine[] = [
  'blue', 'yellow', 'magenta', 'violet', 'red',
  'green', 'pink', 'orange', 'aqua', 'grey', 'rapid'
];

// Color mapping for metro lines
export const LINE_COLORS: Record<string, string> = {
  blue: '#0052A5',
  yellow: '#FFCB05',
  magenta: '#CC0066',
  violet: '#7B1FA2',
  red: '#E53935',
  green: '#388E3C',
  pink: '#E91E63',
  orange: '#EF6C00',
  aqua: '#00ACC1',
  grey: '#757575',
  rapid: '#EF6C00',
};

export interface MetroStationListResponse {
  status: number;
  stations?: string[];
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
   */
  private standardizeStationName(name: string): string {
    return name.trim();
  }

  /**
   * Common fetch wrapper that adds required headers for ngrok tunnels.
   */
  private async apiFetch(url: string): Promise<Response> {
    return fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });
  }

  /**
   * Fetches the shortest route between two stations.
   */
  async getRoute(from: string, to: string): Promise<MetroRouteResponse> {
    const standardizedFrom = this.standardizeStationName(from);
    const standardizedTo = this.standardizeStationName(to);

    if (!standardizedFrom || !standardizedTo) {
      return { status: 400, message: "Source and destination stations are required." };
    }

    try {
      const url = new URL(`${this.baseUrl}/route-get`);
      url.searchParams.append("from", standardizedFrom);
      url.searchParams.append("to", standardizedTo);

      const response = await this.apiFetch(url.toString());
      const data = await response.json();

      return data as MetroRouteResponse;
    } catch (error) {
      console.error("MetroAPI Error (getRoute):", error);
      return { status: 500, message: "Failed to connect to the Metro API." };
    }
  }

  /**
   * Retrieves all stations for a specific metro line.
   */
  async getStationsByLine(line: MetroLine | string): Promise<MetroStationListResponse> {
    const standardizedLine = typeof line === 'string' ? line.trim().toLowerCase() : line;

    try {
      const url = new URL(`${this.baseUrl}/stations-get`);
      url.searchParams.append("value", standardizedLine);

      const response = await this.apiFetch(url.toString());
      const data = await response.json();

      if (Array.isArray(data)) {
        return { status: 200, stations: data };
      }

      return data as MetroStationListResponse;
    } catch (error) {
      console.error("MetroAPI Error (getStationsByLine):", error);
      return { status: 500, message: "Failed to connect to the Metro API." };
    }
  }

  /**
   * Fetches all unique station names from ALL metro lines.
   * Used for autocomplete.
   */
  async getAllStations(): Promise<string[]> {
    try {
      const allStations = new Set<string>();
      
      const results = await Promise.allSettled(
        METRO_LINES.map(line => this.getStationsByLine(line))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.stations) {
          result.value.stations.forEach(s => allStations.add(s));
        }
      }

      return Array.from(allStations).sort();
    } catch (error) {
      console.error("MetroAPI Error (getAllStations):", error);
      return [];
    }
  }

  /**
   * Helper to translate API status codes to user-friendly messages.
   */
  getErrorByCode(status: number): string {
    switch (status) {
      case 204: return "Source and destination are the same station.";
      case 400: return "Missing parameters.";
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
