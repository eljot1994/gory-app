// frontend/src/components/TripDetails.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getTrip,
  getLocations,
  getPhotos,
  createLocation,
  uploadPhoto,
  Trip,
  TripLocation,
  Photo,
} from "../api";

export default function TripDetails() {
  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [locations, setLocations] = useState<TripLocation[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  // FORM — LOCATION
  const [locName, setLocName] = useState("");
  const [locLat, setLocLat] = useState<string>("");
  const [locLng, setLocLng] = useState<string>("");
  const [locDateFrom, setLocDateFrom] = useState("");
  const [locDateTo, setLocDateTo] = useState("");

  // FORM — PHOTO
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const t = await getTrip(id);
      const loc = await getLocations(id);
      const ph = await getPhotos(id);

      setTrip(t);
      setLocations(loc);
      setPhotos(ph);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !locName.trim()) return;

    const loc = await createLocation(id, {
      name: locName,
      lat: locLat ? parseFloat(locLat) : null,
      lng: locLng ? parseFloat(locLng) : null,
      date_from: locDateFrom || null,
      date_to: locDateTo || null,
      notes: null,
    });

    setLocations([...locations, loc]);

    // reset
    setLocName("");
    setLocLat("");
    setLocLng("");
    setLocDateFrom("");
    setLocDateTo("");
  }

  async function handleUploadPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !photoFile) return;

    const ph = await uploadPhoto(id, photoFile);
    setPhotos([...photos, ph]);
    setPhotoFile(null);
  }

  if (loading) return <div>Ładowanie...</div>;
  if (!trip) return <div>❌ Nie znaleziono wyjazdu</div>;

  return (
    <div style={styles.wrapper}>
      {/* SEKCJA: INFO O WYJEŹDZIE */}
      <div style={styles.card}>
        <h2 style={styles.title}>{trip.name}</h2>

        <div style={styles.row}>
          <strong>ID:</strong> {trip.id}
        </div>
        {trip.date_from && (
          <div style={styles.row}>
            <strong>Od: </strong>
            {trip.date_from}
          </div>
        )}
        {trip.date_to && (
          <div style={styles.row}>
            <strong>Do: </strong>
            {trip.date_to}
          </div>
        )}
        {trip.notes && (
          <div style={styles.row}>
            <strong>Uwagi: </strong>
            {trip.notes}
          </div>
        )}
      </div>

      {/* FORMULARZ: DODAWANIE LOKALIZACJI */}
      <div style={styles.card}>
        <h3 style={styles.subtitle}>Dodaj lokalizację</h3>

        <form onSubmit={handleAddLocation} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Nazwa miejsca (np. Schronisko XYZ)"
            value={locName}
            onChange={(e) => setLocName(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Szerokość (lat)"
            value={locLat}
            onChange={(e) => setLocLat(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Długość (lng)"
            value={locLng}
            onChange={(e) => setLocLng(e.target.value)}
          />

          <input
            style={styles.input}
            type="date"
            value={locDateFrom}
            onChange={(e) => setLocDateFrom(e.target.value)}
          />

          <input
            style={styles.input}
            type="date"
            value={locDateTo}
            onChange={(e) => setLocDateTo(e.target.value)}
          />

          <button style={styles.button}>Dodaj lokalizację</button>
        </form>

        <hr style={styles.hr} />

        <h3 style={styles.subtitle}>Lokalizacje</h3>

        {locations.length === 0 && (
          <div style={styles.empty}>Brak lokalizacji</div>
        )}

        {locations.map((loc) => (
          <div key={loc.id} style={styles.listItem}>
            <strong>{loc.name}</strong>
            <div style={styles.small}>
              {loc.lat && loc.lng ? (
                <>
                  📍 {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </>
              ) : (
                "brak współrzędnych"
              )}
            </div>
            {loc.date_from && (
              <div style={styles.small}>
                📅 {loc.date_from} → {loc.date_to}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FORMULARZ: UPLOAD ZDJĘCIA */}
      <div style={styles.card}>
        <h3 style={styles.subtitle}>Dodaj zdjęcie</h3>

        <form onSubmit={handleUploadPhoto} style={styles.form}>
          <input
            type="file"
            style={styles.input}
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          />

          <button style={styles.button}>Wyślij zdjęcie</button>
        </form>

        <hr style={styles.hr} />

        <h3 style={styles.subtitle}>Zdjęcia</h3>

        {photos.length === 0 && <div style={styles.empty}>Brak zdjęć</div>}

        {photos.map((p) => (
          <div key={p.id} style={styles.listItem}>
            <strong>{p.filename}</strong>

            <div style={styles.small}>
              {p.timestamp ? `📅 ${p.timestamp}` : "data nieznana"}
            </div>

            {p.lat && p.lng && (
              <div style={styles.small}>
                📍 {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- STYLES ----------
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
  },
  card: {
    background: "#fff",
    padding: "22px",
    borderRadius: "12px",
    border: "1px solid #e6e6e6",
    boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
  },
  title: { fontSize: "22px", fontWeight: 600, marginBottom: "10px" },
  subtitle: { fontSize: "18px", fontWeight: 600, marginBottom: "10px" },
  row: { marginBottom: "4px", fontSize: "15px" },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #dcdcdc",
    outline: "none",
    transition: "0.25s",
  },
  button: {
    background: "#fff",
    border: "1px solid #b8e6c1",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
    transition: "0.25s",
    boxShadow: "0 0 0 rgba(80,200,120,0)",
  },
  listItem: {
    padding: "12px 14px",
    background: "#fafafa",
    borderRadius: "10px",
    border: "1px solid #e5e5e5",
    marginBottom: "8px",
    transition: "0.25s",
  },
  small: { fontSize: "13px", opacity: 0.7 },
  empty: { opacity: 0.6, fontStyle: "italic", paddingBottom: "5px" },
  hr: { border: "none", borderBottom: "1px solid #eee", margin: "15px 0" },
};
