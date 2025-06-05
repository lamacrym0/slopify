import { useEffect, useState } from "react";

export function useMe() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetchMe = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/me`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setMe(data.user);
      } else {
        setMe(null);
      }
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch(`${import.meta.env.VITE_SERVER_URL}/logout`, {
      method: "POST",
      credentials: "include"
    });
    setMe(null);
  };

  useEffect(() => {
    refetchMe();
  }, []);

  return { me, loading, logout, refetchMe };
}
