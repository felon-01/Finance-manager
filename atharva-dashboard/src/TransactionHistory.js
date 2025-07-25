import React, { useEffect, useState } from "react";

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => console.error("Failed to fetch:", err));
  }, []);

  return (
    <div style={{ background: "#1e1e1e", color: "#f0f0f0", padding: "1rem", borderRadius: "12px", marginTop: "1rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>📜 Transaction History</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Category</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr key={index}>
              <td style={tdStyle}>{new Date(tx.timestamp).toLocaleString()}</td>
              <td style={tdStyle}>{tx.description}</td>
              <td style={tdStyle}>₹ {tx.amount}</td>
              <td style={tdStyle}>{tx.type}</td>
              <td style={tdStyle}>{tx.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { borderBottom: "1px solid #555", padding: "0.5rem", color: "#ccc" };
const tdStyle = { borderBottom: "1px solid #333", padding: "0.5rem" };

export default TransactionHistory;
