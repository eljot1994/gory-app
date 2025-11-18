// frontend/src/components/TripsList.tsx
import { useEffect, useState } from "react";
import { getTrips, createTrip, Trip } from "../api";
import { Link } from "react-router-dom";

export default function TripsList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTripId, setNewTripId] = useState("");
  const [newTripName, setNewTripName] = useState("");

  useEffect(() => {
    async function load() {
      const data = await getTrips();
      setTrips(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleCreateTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!newTripId || !newTripName) return;

    const trip = await createTrip({
      id: newTripId,
      name: newTripName,
      date_from: null,
      date_to: null,
      notes: null,
    });

    setTrips([trip, ...trips]);
    setNewTripId("");
    setNewTripName("");
  }

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Twoje wyjazdy</h2>

      {/* FORMULARZ DODAWANIA */}
      <form onSubmit={handleCreateTrip} style={styles.form}>
        <input
          style={styles.input}
          placeholder="ID wyjazdu (np. t2024-alpy)"
          value={newTripId}
          onChange={(e) => setNewTripId(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Nazwa wyjazdu"
          value={newTripName}
          onChange={(e) => setNewTripName(e.target.value)}
        />

        <button style={styles.button}>Dodaj</button>
      </form>

      {/* LISTA WYJAZDÓW */}
      <div style={styles.list}>
        {trips.map((t) => (
          <Link key={t.id} to={`/trip/${t.id}`} style={styles.item}>
            <div>
              <div style={styles.itemTitle}>{t.name}</div>
              <div style={styles.itemId}>{t.id}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------- STYLES ----------
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
  },
  title: {
    margin: "0 0 20px 0",
    fontSize: "22px",
    fontWeight: 600,
  },
  form: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #dadada",
    flexGrow: 1,
    outline: "none",
    transition: "0.2s",
  },
  button: {
    backgroundColor: "#ffffff",
    border: "1px solid #c6e8c6",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
    transition: "0.3s",
    boxShadow: "0 0 0 rgba(0,255,100,0)",
  } as React.CSSProperties,
  list: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  item: {
    padding: "14px 18px",
    backgroundColor: "#fafafa",
    borderRadius: "10px",
    border: "1px solid #e5e5e5",
    textDecoration: "none",
    color: "#222",
    transition: "0.25s",
    boxShadow: "0 0 0 rgba(0,180,80,0)",
  } as React.CSSProperties,
  itemTitle: {
    fontSize: "17px",
    fontWeight: 600,
  },
  itemId: {
    fontSize: "13px",
    opacity: 0.6,
  },
};
