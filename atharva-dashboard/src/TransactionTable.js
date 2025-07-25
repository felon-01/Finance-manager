export default function TransactionTable({ transactions }) {
  return (
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
      <tr key={index}>
        <td>{new Date(tx.timestamp).toLocaleDateString()}</td>
        <td className={tx.type === 'income' ? 'income' : 'expense'}>
          {tx.type}
        </td>
        <td>{tx.category}</td>
        <td>{tx.description}</td>
        <td>₹{tx.amount.toLocaleString()}</td>
      </tr>
    ))}
  </tbody>
</table>
  )
}