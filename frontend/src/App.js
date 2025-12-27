import React, { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://backend-production-c3b5.up.railway.app/api/hello")
      .then((resp) => {
        if (!resp.ok) throw new Error(resp.statusText);
        return resp.json();
      })
      .then(setData)
      .catch((e) => setError(e.message || "Erreur inconnue"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Test API Backend</h1>
      {loading && <p>Chargement…</p>}
      {error && <p style={{color:'red'}}>Erreur: {error}</p>}
      {data && (
        <div style={{background: "#ebf9eb", borderRadius: "12px", padding:"12px", margin:"16px 0"}}>
          <p>{data.message}</p>
          <p>Heure serveur : <b>{data.heure}</b></p>
        </div>
      )}
    </div>
  );
}

export default App;
