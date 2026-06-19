import React, { createContext, useContext, useState, useEffect } from "react";
import { auth as authApi, user as userApi } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const response = await userApi.get();
        const freshUser = response.data || response;
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem("user", JSON.stringify(freshUser));
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    const responseData = res.data || res;
    const token = responseData.token;
    const userData = responseData.user || responseData;
    if (!token) throw new Error("No token received from server");
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return responseData;
  };

  const register = async (username, email, password) => {
    const res = await authApi.register(username, email, password);
    const responseData = res.data || res;
    const token = responseData.token;
    const userData = responseData.user || responseData;
    if (!token) throw new Error("No token received from server");
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return responseData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = async (updates) => {
    let payload = typeof updates === "function" ? updates(user) : updates;

    const apiFields = ["username", "email", "public_profile", "show_on_leaderboard"];
    const hasApiField = Object.keys(payload || {}).some(key => apiFields.includes(key));
    
    let responseData = {};
    if (hasApiField) {
      const res = await userApi.update(payload);
      responseData = res.data || res;
    }
    
    let nextUser;
    setUser((currentUser) => {
      nextUser = { ...currentUser, ...payload, ...responseData };
      localStorage.setItem("user", JSON.stringify(nextUser));
      return nextUser;
    });
    
    return nextUser || { ...user, ...payload, ...responseData };
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, register, updateUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
