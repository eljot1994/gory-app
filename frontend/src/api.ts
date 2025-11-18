// src/api.ts

export interface Trip {
  id: string;
  name: string;
  date_from?: string | null;
  date_to?: string | null;
  notes?: string | null;
}

export interface TripLocation {
  id: number;
  trip_id: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
  date_from?: string | null;
  date_to?: string | null;
  notes?: string | null;
}

export interface Photo {
  id: number;
  trip_id: string;
  filename: string;
  filepath: string;
  lat?: number | null;
  lng?: number | null;
  timestamp?: string | null;
  notes?: string | null;
}

// Backend root
const API = "http://127.0.0.1:8000";

// GET /api/trips
export async function getTrips(): Promise<Trip[]> {
  const res = await fetch(`${API}/api/trips`);
  return res.json();
}
