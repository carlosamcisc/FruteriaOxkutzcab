import { useEffect, useState } from "react";
import { AuthProvider } from "../features/auth/context/AuthProvider";
import { fallbackRoute, routes } from "./routes";

export function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const renderPage = routes[hash] ?? fallbackRoute;

  return <AuthProvider>{renderPage()}</AuthProvider>;
}
