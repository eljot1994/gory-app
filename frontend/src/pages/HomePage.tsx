import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import { Link } from "react-router-dom";

interface Trip {
  id: string;
  name: string;
  date_from?: string;
  date_to?: string;
  notes?: string;
}

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [newTrip, setNewTrip] = useState({ id: "", name: "" });

  async function load() {
    const res = await fetch(`${API_BASE}/api/trips`);
    setTrips(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function addTrip(e: any) {
    e.preventDefault();

    await fetch(`${API_BASE}/api/trips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTrip),
    });

    setNewTrip({ id: "", name: "" });
    load();
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>🗻 Górskie wyjazdy</h1>

      <form
        className="card"
        onSubmit={addTrip}
        style={{ marginBottom: "1.5rem" }}
      >
        <h2>➕ Dodaj wyjazd</h2>

        <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
          <input
            className="input"
            placeholder="ID (np. 2025-alpy)"
            value={newTrip.id}
            onChange={(e) => setNewTrip((t) => ({ ...t, id: e.target.value }))}
            required
          />

          <input
            className="input"
            placeholder="Nazwa"
            value={newTrip.name}
            onChange={(e) =>
              setNewTrip((t) => ({ ...t, name: e.target.value }))
            }
            required
          />

          <button className="btn">Zapisz</button>
        </div>
      </form>

      <div className="card">
        <h2>📋 Lista wyjazdów</h2>

        <ul style={{ listStyle: "none", marginTop: "1rem", padding: 0 }}>
          {trips.map((t) => (
            <li
              key={t.id}
              style={{
                padding: "0.75rem",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{t.name}</strong>
                <div style={{ fontSize: 12, color: "#555" }}>{t.id}</div>
              </div>

              <Link
                to={`/trip/${t.id}`}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: 8,
                  background: "var(--green-light)",
                  color: "var(--text)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Otwórz →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
