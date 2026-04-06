# Libre Metro - Delhi Metro API Usage Guide

This project provides an easy way to interact with the Delhi Metro Shortest Path API and manage transit data in Supabase.

## Shortest Metro Route API
To calculate the path between two stations, you can use the api/dmrc endpoint. You must specify the type as route and provide both a source and a destination station.

Example API URL for your test:
http://localhost:3001/api/dmrc?type=route&from=Tughlakabad&to=Vishwavidyalaya

This will return the travel time, the full path of stations, and any interchanges required for the journey.

## Metro Station List API
To see all station names for a specific metro line, use the same api/dmrc endpoint but set the type to stations and provide a line name.

Example for Blue Line:
http://localhost:3001/api/dmrc?type=stations&line=blue

## Interactive Route Visualization (Leaflet Map)
Once a route is calculated, an interactive map will appear at the bottom of the results. It plots the exact geographic path of the metro stations and colors the route line based on the primary metro line used.

## Bulk Station Import (Supabase)
To quickly populate your Supabase database from your stops.txt file, you can use the import-stops API. This will read the file and insert all station details into the database.

Example to trigger import:
http://localhost:3001/api/import-stops

## Adding Single Stations (Supabase)
You can manually add individual stations by sending a POST request to the api/stations endpoint.

You must provide: stop_id, stop_name, stop_lat, and stop_lon.

Example usage for adding Okhla Vihar:
POST http://localhost:3001/api/stations with data:
stop_id: 999
stop_name: Okhla Vihar
stop_lat: 28.5612
stop_lon: 77.2919

## Adding Route Suggestions (Supabase)
You can add community-suggested routes by sending a POST request to the api/suggestions endpoint.

You must provide: origin, destination, and full_route (json).

Example usage for your test:
POST http://localhost:3001/api/suggestions with data:
origin: Tughlakabad
destination: Vishwavidyalaya
full_route: ["Tughlakabad", "Kalkaji Mandir", "Vishwavidyalaya"]
hashtags: ["fast", "direct"]

## Important Information about Station Names
When searching for routes, make sure to use the exact station names. The API is case-insensitive, but extra spaces should be avoided. For the best experience, reference the official station list.

## Core Features and Logic
The system automatically accounts for the 9-minute penalty during interchanges between different lines to accurately reflect real-world travel time.

## Setting up your Backend URL
Ensure your .env.local file is configured with the correct ngrok or localhost address for your Metro API backend using the API and NEXT_PUBLIC_METRO_API_URL variables.
