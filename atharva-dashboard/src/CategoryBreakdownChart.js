import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#d32f2f', '#7e57c2'];

function CategoryBreakdownChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/category-breakdown?type=expense")
      .then(res => res.json())
      .then(data => {
        // Convert object to array format Recharts needs
        const formatted = Object.entries(data).map(([name, value]) => ({ name, value }));
        setData(formatted);
      });
  }, []);

  // Formatter for Rupee values
  const formatRupee = (value) => `₹${value.toLocaleString("en-IN")}`;

  return (
    <div
      style={{
        marginTop: "2rem",
        background: "#1e1e1e",
        padding: "1rem",
        borderRadius: "12px",
        boxShadow: "0 0 10px #000",
        color: "white"
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Expense Breakdown by Category
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, value }) => `${name}: ${formatRupee(value)}`} // label with ₹
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatRupee(value)} /> {/* tooltip with ₹ */}
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CategoryBreakdownChart;
