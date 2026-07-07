import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { USER_SYNC_EVENT, auth as authApi, user as userApi } from "../api.js";

const AuthContext = createContext(null);
const USER_SYNC_INTERVAL_MS = 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const mergeUser = useCallback((patch) => {
    if (!patch || typeof patch !== "object") return null;

    const savedUser = localStorage.getItem("user");
    let baseUser = null;
    if (savedUser) {
      try {
        baseUser = JSON.parse(savedUser);
      } catch {
        baseUser = null;
      }
    }
    const nextUser = { ...(baseUser || {}), ...patch };
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser((currentUser) => ({ ...(currentUser || {}), ...nextUser }));

    return nextUser;
  }, []);

  const refreshUser = useCallback(async ({ clearOnError = false } = {}) => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const response = await userApi.get();
      const freshUser = response.data || response;
      if (!freshUser) return null;

      mergeUser(freshUser);

      return freshUser;
    } catch (error) {
      if (clearOnError) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
      return null;
    }
  }, [mergeUser]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const bootstrapAuth = async () => {
      if (!token || !savedUser) {
        setLoading(false);
        return;
      }

      try {
        setUser(JSON.parse(savedUser));
        await refreshUser({ clearOnError: true });
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, [refreshUser]);

  useEffect(() => {
    const handleUserSync = (event) => {
      mergeUser(event.detail);
    };

    window.addEventListener(USER_SYNC_EVENT, handleUserSync);
    return () => window.removeEventListener(USER_SYNC_EVENT, handleUserSync);
  }, [mergeUser]);

  useEffect(() => {
    if (loading || !user) return undefined;

    const syncUser = () => {
      refreshUser();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncUser();
    };

    const intervalId = window.setInterval(syncUser, USER_SYNC_INTERVAL_MS);
    window.addEventListener("focus", syncUser);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncUser);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loading, refreshUser, user?.id]);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    const responseData = res.data || res;
    const token = responseData.token;
    const userData = responseData.user || responseData;
    if (!token) throw new Error("No token received from server");
    localStorage.setItem("token", token);
    mergeUser(userData);
    return responseData;
  };

  const register = async (username, email, password) => {
    const res = await authApi.register(username, email, password);
    const responseData = res.data || res;
    const token = responseData.token;
    const userData = responseData.user || responseData;
    if (!token) throw new Error("No token received from server");
    localStorage.setItem("token", token);
    mergeUser(userData);
    return responseData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/", { replace: true });
  };

  const updateUser = async (updates) => {
    const savedUser = localStorage.getItem("user");
    let latestUser = user;
    if (savedUser) {
      try {
        latestUser = JSON.parse(savedUser);
      } catch {
        latestUser = user;
      }
    }
    let payload = typeof updates === "function" ? updates(latestUser) : updates;

    const apiFields = ["username", "email", "profile_image", "bio", "public_profile", "show_on_leaderboard"];
    const hasApiField = Object.keys(payload || {}).some(key => apiFields.includes(key));

    let responseData = {};
    if (hasApiField) {
      const res = await userApi.update(payload);
      responseData = res.data || res;
    }

    let nextUser;
    nextUser = mergeUser({ ...payload, ...responseData });

    return nextUser || { ...user, ...payload, ...responseData };
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, register, updateUser, refreshUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
