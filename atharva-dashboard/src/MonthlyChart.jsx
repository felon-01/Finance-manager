import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MonthlySummaryChart = () => {
  const data = {
    labels: ["2025-07", "2025-08", "2025-09"],
    datasets: [
      {
        label: "Food",
        data: [1200, 800, 1000],
        backgroundColor: "#FF6384", // visible pink
      },
      {
        label: "Transport",
        data: [500, 600, 400],
        backgroundColor: "#36A2EB", // visible blue
      },
      {
        label: "Rent",
        data: [9000, 9000, 9000],
        backgroundColor: "#4BC0C0", // teal
      },
      {
        label: "Other",
        data: [300, 200, 100],
        backgroundColor: "#FFCE56", // yellow
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#ffffff",
        },
      },
      tooltip: {
        backgroundColor: "#222",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#ffffff",
        },
        grid: {
          color: "#444444",
        },
      },
      y: {
        ticks: {
          color: "#ffffff",
        },
        grid: {
          color: "#444444",
        },
      },
    },
  };

  return (
    <div
      style={{
        maxWidth: "90%",
        height: "420px",
        margin: "40px auto",
        backgroundColor: "#121212",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#ffffff",
          marginBottom: "20px",
          fontSize: "24px",
        }}
      >
        Monthly Expense Summary
      </h2>
      <Bar data={data} options={options} />
    </div>
  );
};

export default MonthlySummaryChart;
