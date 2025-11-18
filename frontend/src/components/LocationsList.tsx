import { useEffect, useState } from "react";
import { API_BASE } from "../api";

interface Location {
  id: number;
  name: string;
  lat?: number;
  lng?: number;
}

export default function LocationsList({ tripId }: { tripId: string }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const res = await fetch(`${API_BASE}/api/trips/${tripId}/locations`);
    setLocations(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: any) {
    e.preventDefault();

    await fetch(`${API_BASE}/api/trips/${tripId}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setName("");
    load();
  }

  return (
    <div className="card">
      <h2>📍 Lokalizacje</h2>

      <form
        onSubmit={add}
        style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}
      >
        <input
          className="input"
          placeholder="Dodaj lokalizację"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn">+</button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
        {locations.map((l) => (
          <li
            key={l.id}
            style={{
              padding: "0.75rem",
              borderBottom: "1px solid #eee",
            }}
          >
            <strong>{l.name}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
