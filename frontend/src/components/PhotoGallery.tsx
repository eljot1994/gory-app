import { useEffect, useState } from "react";
import { API_BASE } from "../api";

interface Photo {
  id: number;
  filename: string;
  filepath: string;
}

export default function PhotoGallery({ tripId }: { tripId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    const res = await fetch(`${API_BASE}/api/trips/${tripId}/photos`);
    setPhotos(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(e: any) {
    e.preventDefault();
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    await fetch(`${API_BASE}/api/trips/${tripId}/photos`, {
      method: "POST",
      body: form,
    });

    setFile(null);
    load();
  }

  return (
    <div className="card">
      <h2>🖼 Zdjęcia</h2>

      <form onSubmit={upload} style={{ marginTop: "1rem" }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button className="btn" style={{ marginTop: "0.5rem" }}>
          Wyślij
        </button>
      </form>

      <div
        style={{
          marginTop: "1rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "1rem",
        }}
      >
        {photos.map((p) => (
          <div key={p.id}>
            <img
              src={`${API_BASE}/${p.filepath}`}
              style={{
                width: "100%",
                borderRadius: 10,
                objectFit: "cover",
                height: 120,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
