export default function TransactionTable({ transactions = [] }) {
  // Handle empty transactions array
  if (!transactions.length) {
    return (
      <div className="empty-transactions">
        <p>No transactions to display</p>
      </div>
    );
  }

  return (
    <div className="transaction-table-container">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr key={tx.id || `transaction-${index}`} className="transaction-row">
              <td className="date-cell">
                {new Date(tx.timestamp).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </td>
              <td className={`type-cell ${tx.type === 'income' ? 'income' : 'expense'}`}>
                <span className="type-badge">
                  {tx.type}
                </span>
              </td>
              <td className="category-cell">
                {tx.category || 'Other'}
              </td>
              <td className="description-cell">
                <div className="description-text" title={tx.description}>
                  {tx.description}
                </div>
              </td>
              <td className={`amount-cell ${tx.type === 'income' ? 'income' : 'expense'}`}>
                <span className="amount-value">
                  {tx.type === 'income' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Suggested CSS styles (add to your CSS file):

.transaction-table-container {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.transaction-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background: white;
}

.transaction-table th {
  background-color: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.transaction-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.transaction-row:hover {
  background-color: #f9fafb;
}

.date-cell {
  white-space: nowrap;
  color: #6b7280;
  font-size: 13px;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-cell.income .type-badge {
  background-color: #dcfce7;
  color: #166534;
}

.type-cell.expense .type-badge {
  background-color: #fee2e2;
  color: #dc2626;
}

.category-cell {
  color: #4b5563;
  font-weight: 500;
}

.description-cell {
  max-width: 200px;
}

.description-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amount-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.amount-cell.income .amount-value {
  color: #059669;
}

.amount-cell.expense .amount-value {
  color: #dc2626;
}

.empty-transactions {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  font-style: italic;
}

@media (max-width: 768px) {
  .transaction-table {
    font-size: 12px;
  }
  
  .transaction-table th,
  .transaction-table td {
    padding: 8px 12px;
  }
  
  .description-cell {
    max-width: 120px;
  }
}

*/