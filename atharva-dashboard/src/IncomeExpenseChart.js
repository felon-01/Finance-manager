import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

function IncomeExpenseChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/monthly-income-expense")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div style={{ marginTop: "2rem", background: "#1e1e1e", padding: "1rem", borderRadius: "12px", boxShadow: "0 0 10px #000" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Monthly Income vs Expense</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#4caf50" name="Income" />
          <Bar dataKey="expense" fill="#f44336" name="Expense" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default IncomeExpenseChart;
