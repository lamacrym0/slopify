import React, { useState, useContext } from "react";
import UserContext from "./UserContext.jsx";
import {
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Box,
} from "@mui/material";

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
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      await refetchMe();
    } else {
      const data = await res.json();
      setError(data.message || "Échec de la connexion");
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, mt: 6 }}>
        <Typography variant="h5" gutterBottom align="center">
          Connexion
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleLogin} noValidate>
          <TextField
            fullWidth
            label="Adresse email"
            type="email"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Mot de passe"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
          >
            Connexion
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}