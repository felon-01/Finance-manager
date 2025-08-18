import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, logout } from "./auth";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("⚠ Please choose a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const data = await res.json();
      setMessage(data.message || "✅ File uploaded successfully!");
    } catch (err) {
      setMessage("❌ Upload failed.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121212",
        color: "white",
        padding: "2rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <h1>
          Upload Transactions <span>📂</span>
        </h1>
        <div>
          <button
            onClick={() => navigate("/")}
            style={{
              marginRight: "1rem",
              background: "#333",
              border: "none",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
            }}
          >
            ⬅ Back to Dashboard
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            style={{
              background: "#c62828",
              border: "none",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
            }}
          >
            🔒 Logout
          </button>
        </div>
      </div>

      {/* Upload Card */}
      <div
        style={{
          maxWidth: "500px",
          margin: "auto",
          background: "#1e1e1e",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 0 20px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "1.5rem", color: "#4caf50" }}>
          Upload Bank Statement
        </h2>

        <form onSubmit={handleUpload}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              style={{
                background: "#2a2a2a",
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid #444",
                color: "white",
                cursor: "pointer",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: "#4caf50",
              border: "none",
              padding: "0.8rem 1.5rem",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Upload
          </button>
        </form>

        {message && (
          <p style={{ marginTop: "1rem", color: "#ccc" }}>{message}</p>
        )}
      </div>
    </div>
  );
}
