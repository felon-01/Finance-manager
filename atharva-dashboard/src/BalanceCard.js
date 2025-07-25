// BalanceCard.js

export default function BalanceCard({ label, amount, color }) {
  return (
    <div className="card">
      <h3 style={{ color }}>{label}</h3>
      <p className="amount">
        {amount.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR"
        })}
      </p>
    </div>
  );
}
