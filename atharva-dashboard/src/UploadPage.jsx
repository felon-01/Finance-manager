import { useState } from "react";

function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("⚠️ Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    setMessage(data.message || data.error);
  };

  return (
    <div
      style={{
        marginTop: "3rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "500px",
          background: "#121212",
          padding: "2rem",
          borderRadius: "16px",
          boxShadow: "0 0 20px rgba(0,0,0,0.7)",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.6rem", color: "#4caf50" }}>
          Upload Bank Statement
        </h2>
        <form
          onSubmit={handleUpload}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.2rem",
          }}
        >
          <input
            type="file"
            accept=".csv,.pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={{
              padding: "0.8rem",
              background: "#1e1e1e",
              color: "white",
              border: "1px solid #333",
              borderRadius: "10px",
              width: "100%",
              cursor: "pointer",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.8rem 1.5rem",
              border: "none",
              borderRadius: "12px",
              background: "linear-gradient(90deg, #4caf50, #2e7d32)",
              color: "white",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) =>
              (e.target.style.background =
                "linear-gradient(90deg, #66bb6a, #388e3c)")
            }
            onMouseOut={(e) =>
              (e.target.style.background =
                "linear-gradient(90deg, #4caf50, #2e7d32)")
            }
          >
            Upload
          </button>
        </form>
        {message && (
          <p
            style={{
              marginTop: "1.5rem",
              fontSize: "0.95rem",
              color: message.includes("⚠️") ? "#f44336" : "#4caf50",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
