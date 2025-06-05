import React, { useState, useContext } from "react";
import UserContext from "./UserContext.jsx";

export default function SignupForm() {
  const { refetchMe } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/signup`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      await refetchMe(); // auto login
    } else {
      const data = await res.json();
      setError(data.message || "Erreur lors de la création du compte");
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h2>Créer un compte</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Mot de passe" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Créer un compte</button>
    </form>
  );
}
