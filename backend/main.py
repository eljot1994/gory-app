from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
import sqlite3
import os

from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from fastapi import UploadFile, File
import shutil
import datetime

from fastapi.staticfiles import StaticFiles

# ---------------------------------------
# BAZA DANYCH
# ---------------------------------------

DB_PATH = "data/trips.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def extract_exif(path: str):
    try:
        image = Image.open(path)
        exif = image._getexif()
        if not exif:
            return None, None, None
        
        exif_data = {}
        for tag_id, value in exif.items():
            tag = TAGS.get(tag_id, tag_id)
            exif_data[tag] = value

        lat = None
        lng = None
        timestamp = None

        # GPS
        gps_info = exif_data.get("GPSInfo")
        if gps_info:
            gps = {}
            for t in gps_info:
                subtag = GPSTAGS.get(t, t)
                gps[subtag] = gps_info[t]

            def convert_to_degrees(value):
                d = value[0][0] / value[0][1]
                m = value[1][0] / value[1][1]
                s = value[2][0] / value[2][1]
                return d + (m / 60.0) + (s / 3600.0)

            if "GPSLatitude" in gps and "GPSLatitudeRef" in gps:
                lat = convert_to_degrees(gps["GPSLatitude"])
                if gps["GPSLatitudeRef"] == "S":
                    lat = -lat

            if "GPSLongitude" in gps and "GPSLongitudeRef" in gps:
                lng = convert_to_degrees(gps["GPSLongitude"])
                if gps["GPSLongitudeRef"] == "W":
                    lng = -lng

        # Timestamp
        if "DateTimeOriginal" in exif_data:
            timestamp = exif_data["DateTimeOriginal"]

        return lat, lng, timestamp

    except Exception:
        return None, None, None
    


def init_db():
    os.makedirs("data", exist_ok=True)
    conn = get_db()

    # Tabela wyjazdów
    conn.execute("""
        CREATE TABLE IF NOT EXISTS trips (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            date_from TEXT,
            date_to TEXT,
            notes TEXT
        )
    """)

    # Tabela lokalizacji
    conn.execute("""
        CREATE TABLE IF NOT EXISTS trip_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id TEXT NOT NULL,
            name TEXT NOT NULL,
            lat REAL,
            lng REAL,
            date_from TEXT,
            date_to TEXT,
            notes TEXT,
            FOREIGN KEY(trip_id) REFERENCES trips(id)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            lat REAL,
            lng REAL,
            timestamp TEXT,
            notes TEXT,
            FOREIGN KEY(trip_id) REFERENCES trips(id)
        )
    """)

    conn.commit()
    conn.close()


# ---------------------------------------
# MODELE API (Pydantic 2.x)
# ---------------------------------------

class Trip(BaseModel):
    id: str
    name: str
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TripCreate(BaseModel):
    id: str
    name: str
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TripLocation(BaseModel):
    id: int
    trip_id: str
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TripLocationCreate(BaseModel):
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class Photo(BaseModel):
    id: int
    trip_id: str
    filename: str
    filepath: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    timestamp: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PhotoUpdate(BaseModel):
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------
# APLIKACJA FASTAPI
# ---------------------------------------

app = FastAPI()
init_db()

app.mount("/photos", StaticFiles(directory="photos"), name="photos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------
# ENDPOINTY
# ---------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# -------- TRIPS -------------------------------------------------

@app.get("/api/trips", response_model=List[Trip])
def list_trips():
    conn = get_db()
    rows = conn.execute("SELECT * FROM trips ORDER BY date_from DESC").fetchall()
    conn.close()
    return [Trip(**dict(r)) for r in rows]


@app.get("/api/trips/{trip_id}", response_model=Trip)
def get_trip(trip_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM trips WHERE id = ?", (trip_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Trip not found")
    return Trip(**dict(row))


@app.post("/api/trips", response_model=Trip)
def create_trip(trip: TripCreate):
    conn = get_db()

    exists = conn.execute("SELECT 1 FROM trips WHERE id = ?", (trip.id,)).fetchone()
    if exists:
        conn.close()
        raise HTTPException(status_code=400, detail="Trip ID already exists")

    conn.execute("""
        INSERT INTO trips (id, name, date_from, date_to, notes)
        VALUES (?, ?, ?, ?, ?)
    """, (trip.id, trip.name, trip.date_from, trip.date_to, trip.notes))

    conn.commit()
    conn.close()

    return trip


@app.put("/api/trips/{trip_id}", response_model=Trip)
def update_trip(trip_id: str, trip: TripCreate):
    conn = get_db()

    exists = conn.execute("SELECT 1 FROM trips WHERE id = ?", (trip_id,)).fetchone()
    if not exists:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")

    conn.execute("""
        UPDATE trips
        SET id = ?, name = ?, date_from = ?, date_to = ?, notes = ?
        WHERE id = ?
    """, (trip.id, trip.name, trip.date_from, trip.date_to, trip.notes, trip_id))

    conn.commit()
    conn.close()

    return trip


@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: str):
    conn = get_db()
    conn.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}


# -------- TRIP LOCATIONS ----------------------------------------

@app.get("/api/trips/{trip_id}/locations", response_model=List[TripLocation])
def list_locations(trip_id: str):
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM trip_locations
        WHERE trip_id = ?
        ORDER BY date_from
    """, (trip_id,)).fetchall()

    conn.close()
    return [TripLocation(**dict(r)) for r in rows]


@app.post("/api/trips/{trip_id}/locations", response_model=TripLocation)
def create_location(trip_id: str, loc: TripLocationCreate):
    conn = get_db()

    exists = conn.execute("SELECT 1 FROM trips WHERE id = ?", (trip_id,)).fetchone()
    if not exists:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")

    conn.execute("""
        INSERT INTO trip_locations (trip_id, name, lat, lng, date_from, date_to, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (trip_id, loc.name, loc.lat, loc.lng, loc.date_from, loc.date_to, loc.notes))

    conn.commit()

    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()

    return TripLocation(id=new_id, trip_id=trip_id, **loc.dict())


@app.put("/api/locations/{location_id}", response_model=TripLocation)
def update_location(location_id: int, loc: TripLocationCreate):
    conn = get_db()

    row = conn.execute("SELECT * FROM trip_locations WHERE id = ?", (location_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Location not found")

    trip_id = row["trip_id"]

    conn.execute("""
        UPDATE trip_locations
        SET name = ?, lat = ?, lng = ?, date_from = ?, date_to = ?, notes = ?
        WHERE id = ?
    """, (loc.name, loc.lat, loc.lng, loc.date_from, loc.date_to, loc.notes, location_id))

    conn.commit()
    conn.close()

    return TripLocation(id=location_id, trip_id=trip_id, **loc.dict())


@app.delete("/api/locations/{location_id}")
def delete_location(location_id: int):
    conn = get_db()
    conn.execute("DELETE FROM trip_locations WHERE id = ?", (location_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

@app.post("/api/trips/{trip_id}/photos", response_model=Photo)
async def upload_photo(trip_id: str, file: UploadFile = File(...)):
    # sprawdź czy wyjazd istnieje
    conn = get_db()
    exists = conn.execute("SELECT 1 FROM trips WHERE id = ?", (trip_id,)).fetchone()
    if not exists:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")

    # ścieżka zapisu
    trip_dir = f"photos/{trip_id}"
    os.makedirs(trip_dir, exist_ok=True)

    file_path = f"{trip_dir}/{file.filename}"

    # zapisz plik na dysk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # wyciągnij EXIF
    lat, lng, timestamp = extract_exif(file_path)

    # zapis w bazie
    conn.execute("""
        INSERT INTO photos (trip_id, filename, filepath, lat, lng, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (trip_id, file.filename, file_path, lat, lng, timestamp))

    conn.commit()

    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()

    return Photo(
        id=new_id,
        trip_id=trip_id,
        filename=file.filename,
        filepath=file_path,
        lat=lat,
        lng=lng,
        timestamp=timestamp,
        notes=None
    )


@app.get("/api/trips/{trip_id}/photos", response_model=List[Photo])
def list_photos(trip_id: str):
    conn = get_db()
    rows = conn.execute("SELECT * FROM photos WHERE trip_id = ?", (trip_id,)).fetchall()
    conn.close()
    return [Photo(**dict(r)) for r in rows]


@app.delete("/api/photos/{photo_id}")
def delete_photo(photo_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM photos WHERE id = ?", (photo_id,)).fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Photo not found")

    filepath = row["filepath"]

    # usuń plik z dysku
    if os.path.exists(filepath):
        os.remove(filepath)

    conn.execute("DELETE FROM photos WHERE id = ?", (photo_id,))
    conn.commit()
    conn.close()

    return {"status": "deleted"}