import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BalanceCard = () => {
  const [data, setData] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/balance')
      .then(res => setData(res.data))
      .catch(err => console.error('Error fetching balance:', err));
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4">Monthly Balance</h2>
      <div className="space-y-2 text-lg">
        <div className="text-green-600">Income: ₹{data.income}</div>
        <div className="text-red-600">Expense: ₹{data.expense}</div>
        <div className="font-bold">Balance: ₹{data.balance}</div>
      </div>
    </div>
  );
};


