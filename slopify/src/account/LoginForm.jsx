import React, { useState, useContext } from "react";
import UserContext from "./UserContext.jsx";

export default function LoginForm() {
  const { refetchMe } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      await refetchMe();
    } else {
      const data = await res.json();
      setError(data.message || "Échec de la connexion");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Connexion</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Mot de passe" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Connexion</button>
    </form>
  );
}
