import { useState, useEffect } from "react";
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
import "./App.css";
import "./index.css"; // ✅ THIS IS CRUCIAL

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

  // 🔐 LOGIN/REGISTER SWITCH
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

  // ✅ MAIN DASHBOARD
  if (loading) return <p className="center">Loading...</p>;
  if (error) return <p className="center error">{error}</p>;

  return (
  <div className="app">
    <div className="header">
      <h1 style={{ flexGrow: 1 }}>Finance Manager 💰</h1>
      <button
        onClick={() => {
          logout();
          setLoggedIn(false);
        }}
        className="logout-button"
      >
        🔒 Logout
      </button>
    </div>

    <div className="card-grid">
      <BalanceCard label="Income" amount={totals.income} color="#2e7d32" />
      <BalanceCard label="Expenses" amount={totals.expense} color="#c62828" />
      <BalanceCard label="Balance" amount={totals.balance} color="#1565c0" />
    </div>

    <AddTransactionForm onAdd={handleAdd} />
    <TransactionTable transactions={transactions} />
    <MonthlySummaryChart />
    <IncomeExpenseChart />
    <CategoryBreakdownChart />
    <MonthlySavingsChart />
    <TransactionHistory />
  </div>
);

}
