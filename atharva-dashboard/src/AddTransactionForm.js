import React, { useState } from "react";

export default function AddTransactionForm({ onAdd }) {
  const [form, setForm] = useState({
    date: "",
    amount: "",
    type: "expense",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? value : value, // Keep amount as string until submission
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Validate and prepare data for submission
    const submissionData = {
      ...form,
      amount: parseFloat(form.amount) || 0, // Convert to number, default to 0 if invalid
    };

    // Basic validation
    if (!submissionData.date || !submissionData.description || submissionData.amount <= 0) {
      alert("Please fill in all fields with valid values");
      setIsSubmitting(false);
      return;
    }

    console.log("📦 Sending form data:", submissionData);

    try {
      // Let the parent component handle the API call to avoid duplicate requests
      await onAdd(submissionData);

      // Reset form on success
      setForm({
        date: "",
        amount: "",
        type: "expense",
        description: "",
      });
      
    } catch (err) {
      alert("❌ Error adding transaction:\n" + err.message);
      console.error("Add transaction error:", err);
    } finally {
      setIsSubmitting(false);
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
          step="0.01"
          min="0"
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
        disabled={isSubmitting}
        className={`px-4 py-2 rounded text-white ${
          isSubmitting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isSubmitting ? 'Adding...' : 'Add Transaction'}
      </button>
    </form>
  );
}