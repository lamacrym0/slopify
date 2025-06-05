import React from "react";
import { BrowserRouter } from "react-router-dom";
import { useMe } from "./account/useMe.jsx";
import UserContext from "./account/UserContext.jsx";

import MainPage from "./pages/MainPage.jsx";
import SignupForm from "./account/SignupForm.jsx";
import LoginForm from "./account/LoginForm.jsx";

import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";

function App() {
  const { me, logout, refetchMe, loading } = useMe();

  if (loading) return <p>Chargement...</p>;

  return (
    <UserContext.Provider value={{ me, logout, refetchMe }}>
      <BrowserRouter>
        <CssBaseline />
        {me ? (
          <MainPage />
        ) : (
          <Container maxWidth="sm" sx={{ mt: 4 }}>
            <LoginForm />
            <SignupForm />
          </Container>
        )}
      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;
