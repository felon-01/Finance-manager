import React, { useEffect, useState, useLayoutEffect } from "react";
import { getTransactions, handleApiError } from './api'; // Import your improved API

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add hover effects when component mounts
  useLayoutEffect(() => {
    addHoverEffect();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getTransactions();
      console.log("🔍 Fetched transactions:", data);
      
      // Ensure we have an array
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        console.warn("⚠️ Expected array, got:", typeof data, data);
        setTransactions([]);
      }
      
    } catch (err) {
      console.error("❌ Failed to fetch transactions:", err);
      const errorMessage = handleApiError(err, "Failed to load transactions");
      setError(errorMessage);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div style={containerStyle}>
        <h2 style={{ marginBottom: "1rem" }}>📜 Transaction History</h2>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div>Loading transactions...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={containerStyle}>
        <h2 style={{ marginBottom: "1rem" }}>📜 Transaction History</h2>
        <div style={{ textAlign: "center", padding: "2rem", color: "#ff6b6b" }}>
          <div>❌ {error}</div>
          <button 
            onClick={fetchTransactions}
            style={retryButtonStyle}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!transactions || transactions.length === 0) {
    return (
      <div style={containerStyle}>
        <h2 style={{ marginBottom: "1rem" }}>📜 Transaction History</h2>
        <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
          <div>📝 No transactions found</div>
          <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Add your first transaction to get started!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>📜 Transaction History</h2>
        <div style={{ fontSize: "0.9rem", color: "#999" }}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
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
              <tr key={tx.id || index} style={trStyle} className="transaction-row">
                <td style={tdStyle}>
                  {new Date(tx.timestamp).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </td>
                <td style={tdStyle}>
                  <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tx.description}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    color: tx.type === 'income' ? '#4ade80' : '#f87171',
                    fontWeight: '600'
                  }}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    ...typeStyle,
                    backgroundColor: tx.type === 'income' ? '#065f46' : '#7f1d1d',
                    color: tx.type === 'income' ? '#4ade80' : '#fca5a5'
                  }}>
                    {tx.type}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={categoryStyle}>
                    {tx.category || 'Other'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Refresh button */}
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <button 
          onClick={fetchTransactions}
          style={refreshButtonStyle}
          className="refresh-btn"
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}

// Styles
const containerStyle = {
  background: "linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)",
  color: "#f0f0f0",
  padding: "1.5rem",
  borderRadius: "16px",
  marginTop: "1rem",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  border: "1px solid rgba(255, 255, 255, 0.1)"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
  backgroundColor: "rgba(0, 0, 0, 0.2)",
  borderRadius: "8px",
  overflow: "hidden"
};

const thStyle = {
  borderBottom: "2px solid #4a4a4a",
  padding: "1rem 0.75rem",
  color: "#e5e7eb",
  fontWeight: "600",
  backgroundColor: "rgba(0, 0, 0, 0.3)",
  fontSize: "0.9rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const tdStyle = {
  borderBottom: "1px solid #374151",
  padding: "0.75rem",
  fontSize: "0.9rem"
};

const trStyle = {
  transition: "background-color 0.2s ease",
  cursor: "pointer"
};

const typeStyle = {
  padding: "0.25rem 0.5rem",
  borderRadius: "12px",
  fontSize: "0.75rem",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const categoryStyle = {
  padding: "0.25rem 0.5rem",
  borderRadius: "8px",
  fontSize: "0.8rem",
  backgroundColor: "rgba(99, 102, 241, 0.2)",
  color: "#a5b4fc",
  border: "1px solid rgba(99, 102, 241, 0.3)"
};

const refreshButtonStyle = {
  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: "500",
  transition: "all 0.2s ease",
  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)"
};

const retryButtonStyle = {
  ...refreshButtonStyle,
  backgroundColor: "#dc2626",
  marginTop: "1rem"
};

// Add hover effects with CSS-in-JS
const addHoverEffect = () => {
  const style = document.createElement('style');
  style.textContent = `
    .transaction-row:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
    .refresh-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
    }
  `;
  document.head.appendChild(style);
};

export default TransactionHistory;