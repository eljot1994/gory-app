// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import TripsList from "./components/TripsList";
import TripDetails from "./components/TripDetails";

export default function App() {
  return (
    <BrowserRouter>
      <div style={styles.layout}>
        <header style={styles.header}>
          <Link to="/" style={styles.logo}>
            gory.app
          </Link>
        </header>

        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<TripsList />} />
            <Route path="/trip/:id" element={<TripDetails />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

// ---------- INLINE STYLES ----------
const styles: Record<string, React.CSSProperties> = {
  layout: {
    backgroundColor: "#f5f7f7",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter, sans-serif",
  },
  header: {
    padding: "15px 25px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e3e3e3",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  logo: {
    fontSize: "20px",
    fontWeight: 600,
    textDecoration: "none",
    color: "#222",
    padding: "5px 10px",
    borderRadius: "6px",
    transition: "0.2s",
  },
  main: {
    padding: "25px",
    maxWidth: "900px",
    width: "100%",
    margin: "0 auto",
  },
};
