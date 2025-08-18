import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"; // ✅ Router setup
import { getTransactions, getBalance, addTransaction } from "./api";
import BalanceCard from "./BalanceCard";
import TransactionTable from "./TransactionTable";
import AddTransactionForm from "./AddTransactionForm";
import MonthlySummaryChart from "./MonthlySummaryChart";
import IncomeExpenseChart from "./IncomeExpenseChart";
import CategoryBreakdownChart from "./CategoryBreakdownChart";
import MonthlySavingsChart from "./MonthlySavingsChart";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { getToken, logout } from "./auth";
import TransactionHistory from "./TransactionHistory";
import UploadPage from "./UploadPage";
import "./App.css";
import "./index.css";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [showRegister, setShowRegister] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loggedIn) return;

    Promise.all([getTransactions(), getBalance()])
      .then(([txs, bal]) => {
        setTransactions(txs);
        setTotals(bal);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not reach server");
        setLoading(false);
      });
  }, [loggedIn]);

  const handleAdd = async (tx) => {
    try {
      await addTransaction(tx);
      const [txs, bal] = await Promise.all([getTransactions(), getBalance()]);
      setTransactions(txs);
      setTotals(bal);
    } catch {
      alert("Error adding transaction");
    }
  };

  // 🔐 LOGIN/REGISTER
  if (!loggedIn) {
    return (
      <div className="auth-container">
        {showRegister ? (
          <>
            <RegisterForm onRegisterSuccess={() => setShowRegister(false)} />
            <p className="link" onClick={() => setShowRegister(false)}>
              Already have an account? Login
            </p>
          </>
        ) : (
          <>
            <LoginForm onLogin={() => setLoggedIn(true)} />
            <p className="link" onClick={() => setShowRegister(true)}>
              Don’t have an account? Register
            </p>
          </>
        )}
      </div>
    );
  }

  // ✅ MAIN APP ROUTES
  return (
    <Router>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/"
          element={
            <div className="app">
              {/* 🔹 HEADER */}
              <div className="header">
                <h1 style={{ flexGrow: 1 }}>Finance Manager 💰</h1>
                <nav>
                  <Link to="/upload" className="nav-button">
                    ⬆ Upload
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setLoggedIn(false);
                    }}
                    className="logout-button"
                  >
                    🔒 Logout
                  </button>
                </nav>
              </div>

              {/* 🔹 CARDS */}
              <div className="card-grid">
                <BalanceCard label="Income" amount={totals.income} color="#2e7d32" />
                <BalanceCard label="Expenses" amount={totals.expense} color="#c62828" />
                <BalanceCard label="Balance" amount={totals.balance} color="#1565c0" />
              </div>

              {/* 🔹 FORMS & DATA */}
              <AddTransactionForm onAdd={handleAdd} />
              <TransactionTable transactions={transactions} />

              {/* 🔹 CHARTS */}
              <MonthlySummaryChart />
              <IncomeExpenseChart />
              <CategoryBreakdownChart />
              <MonthlySavingsChart />
              <TransactionHistory />
            </div>
          }
        />

        {/* Upload Page */}
        <Route
          path="/upload"
          element={
            <div className="app">
              <div className="header">
                <h1 style={{ flexGrow: 1 }}>Upload Transactions 📂</h1>
                <nav>
                  <Link to="/" className="nav-button">
                    ⬅ Back to Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setLoggedIn(false);
                    }}
                    className="logout-button"
                  >
                    🔒 Logout
                  </button>
                </nav>
              </div>
              <UploadPage />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
