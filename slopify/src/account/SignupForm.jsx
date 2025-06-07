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
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      await refetchMe(); // auto login
    } else {
      const data = await res.json();
      setError(data.message || "Erreur lors de la création du compte");
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, mt: 6 }}>
        <Typography variant="h5" gutterBottom align="center">
          Créer un compte
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSignup} noValidate>
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
            Créer un compte
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}