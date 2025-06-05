import React from "react";
import Header from "../components/Header";
import { Routes, Route } from "react-router-dom";
import Home from "./Home.jsx";
import Events from "./Events.jsx";
import MyEvents from "./MyEvents.jsx";

export default function MainPage() {
  return (
    <>
      <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/my-events" element={<MyEvents />} />
        </Routes>
    </>
  );
}
