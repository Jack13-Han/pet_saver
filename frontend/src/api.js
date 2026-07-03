const API_URL = import.meta.env.VITE_API_URL || "/api/index.php";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function api(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const [route, queryString] = endpoint.split("?");
  const url = new URL(API_URL, window.location.origin);

  url.searchParams.set("route", route);

  if (queryString) {
    const params = new URLSearchParams(queryString);
    for (const [key, value] of params.entries()) {
      url.searchParams.append(key, value);
    }
  }

  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";
    const data =
      contentType.includes("application/json") && text
        ? JSON.parse(text)
        : text
          ? { raw: text }
          : {};

    if (!response.ok) {
      throw new ApiError(
        data?.error || data?.raw || `HTTP ${response.status}`,
        response.status,
      );
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      `Network error: ${err.message}. Is PHP server running at ${API_URL}?`,
      0,
    );
  }
}

export const auth = {
  login: (username, password) =>
    api("auth/login", { method: "POST", body: { username, password } }),
  register: (username, email, password) =>
    api("auth/register", {
      method: "POST",
      body: { username, email, password },
    }),
};

export const user = {
  get: () => api("user"),
  update: (data) => api("user", { method: "PUT", body: data }),
  changePassword: (data) => api("user/password", { method: "PUT", body: data }),

  setActiveTarget: (targetId) =>
    api("user/active-target", {
      method: "POST",
      body: { target_id: targetId },
    }),
};

export const dashboard = {
  get: () => api("dashboard"),
};

export const dailyQuests = {
  claim: (questId) =>
    api("daily-quests/claim", {
      method: "POST",
      body: { quest_id: questId },
    }),
};

export const targets = {
  list: (status = "active") => api(`targets?status=${status}`),
  create: (data) => api("targets", { method: "POST", body: data }),
  update: (id, data) => api(`targets/${id}`, { method: "PUT", body: data }),
  delete: (id) => api(`targets/${id}`, { method: "DELETE" }),
};

export const transactions = {
  list: () => api("transactions"),
  create: (data) => api("transactions", { method: "POST", body: data }),
  getInsights: () => api("transactions/insights"),
};

//calendar
export const calendar = {
  get: () => api("calendar"),
  saveSettings: (data) => api("calendar/settings", { method: "POST", body: data }),
  saveNote: (data) => api("calendar/notes", { method: "POST", body: data }),
  deleteNote: (id) => api(`calendar/notes/${id}`, { method: "DELETE" }),
};

export const avatars = {
  care: (data) => api("avatars/care", { method: "POST", body: data }),
};

export const shop = {
  list: (category) => api(`shop${category ? `?category=${category}` : ""}`),
  buy: (accessoryId, targetId) =>
    api("shop/buy", {
      method: "POST",
      body: { accessory_id: accessoryId, target_id: targetId },
    }),
};

export const inventory = {
  list: () => api("inventory"),
};

export const achievements = {
  list: () => api("achievements"),
};

export const receipts = {
  list: () => api("receipts"),
  scan: (data) => api("receipts/scan", { method: "POST", body: data }),
  create: (data) => api("receipts", { method: "POST", body: data }),
};

export const rankings = {
  list: () => api("rankings"),
};

export const budgets = {
  list: () => api("budgets"),
  save: (data) => api("budgets", { method: "POST", body: data }),
};

export const recurring = {
  list: () => api("recurring"),
  create: (data) => api("recurring", { method: "POST", body: data }),
  delete: (id) => api(`recurring/${id}`, { method: "DELETE" }),
};

export const finance = {
  overview: () => api("finance/overview"),
  weeklyReport: () => api("finance/weekly-report"),
  claimMission: (missionId) =>
    api("missions/claim", { method: "POST", body: { mission_id: missionId } }),
};

export default api;
