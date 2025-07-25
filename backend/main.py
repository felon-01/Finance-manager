from models import db, Transaction
from api import app  # Access Flask app with db context
from utils import categorize

def add_transaction():
    with app.app_context():
        date = input("Date (YYYY-MM-DD): ")
        amount = float(input("Amount: "))
        description = input("Description: ")
        t_type = input("Type (income/expense): ")
        category = categorize(description)

        tx = Transaction(date=date, amount=amount, category=category, description=description, type=t_type)
        db.session.add(tx)
        db.session.commit()
        print("Transaction added.")

def show_summary():
    with app.app_context():
        transactions = Transaction.query.all()
        income = sum(t.amount for t in transactions if t.type == "income")
        expense = sum(t.amount for t in transactions if t.type == "expense")
        print(f"\nIncome: ₹{income:.2f}")
        print(f"Expense: ₹{expense:.2f}")
        print(f"Balance: ₹{income - expense:.2f}\n")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # ✅ Only creates tables if they don't exist

    while True:
        print("\n1. Add Transaction\n2. View Summary\n3. Exit")
        choice = input("Choose an option: ")
        if choice == "1":
            add_transaction()
        elif choice == "2":
            show_summary()
        elif choice == "3":
            break
