// src/MonthlySavingsChart.js

import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

function MonthlySavingsChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
  fetch("http://127.0.0.1:5000/monthly-balance")
    .then((res) => res.json())
    .then((data) => {
      setData(data);
    });
}, []);

  return (
    <div style={{
      background: "#1e1e1e",
      padding: "1rem",
      borderRadius: "12px",
      marginTop: "2rem",
      boxShadow: "0 0 10px #000"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Monthly Savings</h2>
      <ResponsiveContainer width="100%" height={300}>
             <LineChart data={data}>
             <CartesianGrid strokeDasharray="3 3" />
             <XAxis dataKey="month" />
             <YAxis />
             <Tooltip
                formatter={(value, name) => {
                  if (name === 'balance') return [`₹${value}`, 'Savings'];
                  if (name === 'expense') return [`₹${value}`, 'Expense'];
                  return [`₹${value}`, name];
    }}
  />
  <Line type="monotone" dataKey="balance" stroke="green" />
  <Line type="monotone" dataKey="expense" stroke="red" />
  </LineChart>

      </ResponsiveContainer>
    </div>
  );
}

export default MonthlySavingsChart;
