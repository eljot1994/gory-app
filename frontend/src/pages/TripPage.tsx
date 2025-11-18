import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import LocationsList from "../components/LocationsList";
import PhotoGallery from "../components/PhotoGallery";

export default function TripPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState<any>(null);

  async function load() {
    const res = await fetch(`${API_BASE}/api/trips/${id}`);
    setTrip(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  if (!trip) return <p style={{ padding: 40 }}>Ładowanie...</p>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        padding: "2rem",
        gap: "2rem",
      }}
    >
      <div>
        <h1>{trip.name}</h1>
        <div style={{ color: "#666", marginBottom: "1rem" }}>{trip.id}</div>

        <LocationsList tripId={trip.id} />
      </div>

      <div>
        <PhotoGallery tripId={trip.id} />
      </div>
    </div>
  );
}
