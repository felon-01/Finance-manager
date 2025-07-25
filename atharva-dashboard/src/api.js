// api.js
import { getToken } from "./auth";

const API_BASE = "http://127.0.0.1:5000";

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function getTransactions() {
  const res = await fetch(`${API_BASE}/transactions`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function getBalance() {
  const res = await fetch(`${API_BASE}/balance`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function addTransaction(data) {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  const data = await res.json();
  localStorage.setItem("token", data.token); // ✅ store JWT
  return data;
}

export async function registerUser(username, password) {
  const res = await fetch("http://127.0.0.1:5000/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error("Registration failed");
  }

  return res.json(); // return { message: "...", etc. }
}
