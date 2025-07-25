import React, { useState } from "react";

export default function AddTransactionForm({ onAdd }) {
  const [form, setForm] = useState({
    date: "",
    amount: "",
    type: "expense",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
  ...prev,
  [name]: name === "amount" ? parseFloat(value) : value,
}));

  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Log the form data for debugging
    console.log("📦 Sending form data:", form);
    console.log("🔍 Final JSON payload:", JSON.stringify(form));

    try {
      const res = await fetch("http://127.0.0.1:5000/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Server Error:", errorText);
        throw new Error(errorText || "Failed to add transaction");
      }

      // Reset form on success
      setForm({
        date: "",
        amount: "",
        type: "expense",
        description: "",
      });

      onAdd(); // Notify parent to refresh list
    } catch (err) {
      alert("❌ Error adding transaction:\n" + err.message);
      console.error("Add transaction error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 space-y-3">
      <h2 className="text-xl font-semibold">Add Transaction</h2>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          className="border p-2 rounded"
          placeholder="Amount"
          required
        />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
          placeholder="Description"
          required
        />
      </div>

      <button
        type="submit"
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Add Transaction
      </button>
    </form>
  );
}
