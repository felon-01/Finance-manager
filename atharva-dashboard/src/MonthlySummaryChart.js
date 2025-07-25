import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// Predefined colors for consistent category colors
const COLORS = [
  "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#c2185b", "#1976d2"
];

function MonthlySummaryChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/summary-by-category")
      .then(res => res.json())
      .then(raw => {
        const transformed = Object.entries(raw).map(([month, categories]) => ({
          month,
          ...categories
        }));
        setData(transformed);
      });
  }, []);

  const categoryKeys = data.length > 0
    ? Object.keys(data[0]).filter(key => key !== "month")
    : [];

  return (
    <div style={{ background: "#1e1e1e", padding: "1rem", borderRadius: "12px", marginTop: "2rem", boxShadow: "0 0 10px #000" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Monthly Expense Summary</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value, name) => [`₹${value.toLocaleString()}`, name]}
            labelStyle={{ color: "#ccc" }}
            contentStyle={{ backgroundColor: "#333", border: "none", borderRadius: "6px", color: "#fff" }}
          />
          <Legend />
          {categoryKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={COLORS[index % COLORS.length]}
              name={key}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlySummaryChart;
