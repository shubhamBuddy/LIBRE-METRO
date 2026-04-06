# 🚇 LIBRE METRO

**Libre Metro** is a modern, neo-brutalist transit application designed for the Delhi Metro network. It provides a system-like interface for route discovery, station information, and community-driven path suggestions.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Supabase Account (for database & authentication)

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_METRO_API_URL=https://your-dmrc-api-host.com
```

### 3. Installation 
```bash
npm install
npm run dev
```

---

## 🛠️ API Documentation

The project utilizes both **Internal Next.js API Routes** (connected to Supabase) and an **External Metro Service** for pathfinding.

### 1. Community Suggestions API
Handles user-submitted route alternatives and "street knowledge."

#### **GET** `/api/suggestions`
Retrieve all community route suggestions.
- **Endpoint:** `http://localhost:3000/api/suggestions`
- **Response Structure:**
  ```json
  {
    "status": 200,
    "data": [
      {
        "id": "uuid",
        "origin": "Tughlaqabad",
        "destination": "Vishwavidyalaya",
        "full_route": ["Tughlaqabad", "Kashmere Gate", "Vishwavidyalaya"],
        "votes": 12,
        "hashtags": ["Less crowded"],
        "created_at": "timestamp"
      }
    ]
  }
  ```

#### **POST** `/api/suggestions`
Submit a new community route suggestion.
- **Endpoint:** `http://localhost:3000/api/suggestions`
- **Payload:**
  ```json
  {
    "origin": "Station A",
    "destination": "Station B",
    "full_route": ["Station A", "Station C", "Station B"],
    "hashtags": ["Fastest", "Seat available"]
  }
  ```

---

### 2. Station Metadata API
Utility for mapping station names to geographical coordinates.

#### **GET** `/api/stations`
Get coordinates for specific stations.
- **Endpoint:** `http://localhost:3000/api/stations?names=Rajiv Chowk,Hauz Khas`
- **Response Structure:**
  ```json
  {
    "status": 200,
    "data": [
      {
        "stop_name": "Rajiv Chowk",
        "stop_lat": 28.6328,
        "stop_lon": 77.2195
      }
    ]
  }
  ```

#### **POST** `/api/import-stops`
Admin utility to bulk import `stops.txt` data into Supabase `stations` table.
- **Endpoint:** `http://localhost:3000/api/import-stops`

---

### 3. Core Metro Service (External)
Interface for the shortest-path algorithm service.

#### **GET** `/route-get`
Calculate the standard shortest path between two stations.
- **Endpoint:** `http://localhost:3000/route-get?from=Hauz Khas&to=Rajiv Chowk`
- **Fields:**
  - `from`: Source station name
  - `to`: Destination station name
- **Response Structure:**
  ```json
  {
    "status": 200,
    "path": ["Hauz Khas", "Green Park", "...", "Rajiv Chowk"],
    "time": 24,
    "interchange": ["Central Secretariat"]
  }
  ```

#### **GET** `/stations-get`
List all stations on a specific line.
- **Endpoint:** `http://localhost:3000/stations-get?value=yellow`
- **Fields:**
  - `value`: Line name (e.g., `blue`, `yellow`, `magenta`, `violet`)

---

## 🎨 Design System

Libre Metro follows high-contrast **Neo-Brutalism**:
- **Palette:** Off-White (`#FFFDF5`), Stark Black (`#000000`), and Vibrant Accent Colors (Yellow, Pink, Blue).
- **Typography:** `Press_Start_2P` for headings, `Space_Grotesk` for body text.
- **Components:** Sharp borders (3px+), hard black shadows (4px/8px), and boxy layouts.

## 🔐 Authentication
Integrated with **Supabase Auth (Google OAuth)**.
- Authentication modal available in the top-right header.
- Required for: Submitting community routes.
- Not required for: Searching standard routes or viewing the map.

---

## 📜 License
Internal Project - Libre Metro Team.
