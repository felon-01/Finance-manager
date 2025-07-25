a// Dashboard.jsx
import React, { useEffect, useState } from "react";
import BalanceCard from "./BalanceCard";
import TransactionList from "./TransactionList";a
import MonthlyChart from "./MonthlyChart";
import TransactionForm from "./TransactionForm";

export default function Dashboard() {
  const [balanceData, setBalanceData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [monthSummary, setMonthSummary] = useState({});

  const fetchBalance = async () => {
    const res = await fetch("http://localhost:5000/balance");
    const data = await res.json();
    setBalanceData(data);
  };

  const fetchTransactions = async () => {
    const res = await fetch("http://localhost:5000/transactions");
    const data = await res.json();
    setTransactions(data);
  };

  const fetchMonthlySummary = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const res = await fetch(`http://localhost:5000/monthly-summary?month=${currentMonth}`);
    const data = await res.json();
    setMonthSummary(data.summary || {});
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    fetchMonthlySummary();
  }, []);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Atharva Finance Dashboard</h1>
      {balanceData && <BalanceCard {...balanceData} />}
      <MonthlyChart summary={monthSummary} />
      <TransactionForm onAdd={fetchTransactions} />
      <TransactionList transactions={transactions} />
    </div>
  );
}
