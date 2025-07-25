import joblib
from models import User
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import extract, func
from flask_cors import CORS
from datetime import datetime
from utils import categorize
from storage import db

model = joblib.load('transaction_classifier.pkl')
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Use a strong secret in production!
jwt = JWTManager(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

from models import Transaction


# -------------------------
# POST /transactions: Add a new transaction
# -------------------------
@app.route('/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    description = data.get('description')
    amount = data.get('amount')
    timestamp_str = data.get('timestamp')  # example: '2025-07-22T14:30:00'
    trans_type = data.get('type')

    # Parse timestamp string into datetime object
    try:
        timestamp = datetime.fromisoformat(timestamp_str)
    except ValueError:
        return jsonify({'error': 'Invalid timestamp format'}), 400

    # Predict category using ML model
    predicted_category = model.predict([description])[0]

    transaction = Transaction(
        amount=amount,
        category=predicted_category,
        timestamp=timestamp,
        type=trans_type,
        description=description
    )
    db.session.add(transaction)
    db.session.commit()

    return jsonify({'message': 'Transaction added successfully', 'category': predicted_category})


    
 # -------------------------
# register
# ------------------------- 

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'User already exists'}), 409

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

# -------------------------
# transactions user
# ------------------------- 


@app.route('/transactions/user', methods=['GET'])  # also fix the route path
@jwt_required()
def get_user_transactions():  # <-- unique name
    current_user = get_jwt_identity()
    print(f"👤 Authenticated user ID: {current_user}")

    transactions = Transaction.query.filter_by(user_id=current_user).all()

    return jsonify([t.to_dict() for t in transactions]), 200




# -------------------------
# login
# ------------------------- 


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=user.id)
        return jsonify({'token': access_token}), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401



 # -------------------------
# category-breakdown
# ------------------------- 

@app.route('/category-breakdown')
def category_breakdown():
    txn_type = request.args.get("type", "expense")  # default: expense
    transactions = Transaction.query.filter_by(type=txn_type).all()

    category_totals = {}
    for txn in transactions:
        category = txn.category or "Other"
        category_totals[category] = category_totals.get(category, 0) + txn.amount

    return jsonify(category_totals)


# -------------------------
# GET /monthly-balance savings
# -------------------------
@app.route('/monthly-balance')
def monthly_balance():
    transactions = Transaction.query.all()

    monthly_data = {}
    for txn in transactions:
        month = txn.timestamp.strftime("%Y-%m")
        if month not in monthly_data:
            monthly_data[month] = {"income": 0, "expense": 0}
        if txn.type == 'income':
            monthly_data[month]["income"] += txn.amount
        elif txn.type == 'expense':
            monthly_data[month]["expense"] += txn.amount

    result = []
    for month in sorted(monthly_data):
        data = monthly_data[month]
        balance = data["income"] - data["expense"]
        result.append({
            "month": month,
            "income": data["income"],
            "expense": data["expense"],
            "balance": balance
        })

    return jsonify(result)



# -------------------------
# monthly-income-expense
# -------------------------


@app.route('/monthly-income-expense')
def monthly_income_expense():
    transactions = Transaction.query.all()

    monthly_data = {}
    for txn in transactions:
        month = txn.timestamp.strftime("%Y-%m")
        if month not in monthly_data:
            monthly_data[month] = {"income": 0, "expense": 0}
        if txn.type == 'income':
            monthly_data[month]["income"] += txn.amount
        else:
            monthly_data[month]["expense"] += txn.amount

    result = [
        {"month": month, **data}
        for month, data in sorted(monthly_data.items())
    ]
    return jsonify(result)


# -------------------------
# GET /transactions
# -------------------------
@app.route('/transactions', methods=['GET'])
def get_transactions():
    query = Transaction.query

    start = request.args.get('start')
    end = request.args.get('end')
    category = request.args.get('category')
    type_ = request.args.get('type')

    if start:
        start_date = datetime.strptime(start, "%Y-%m-%d")
        query = query.filter(Transaction.timestamp >= start_date)
    if end:
        end_date = datetime.strptime(end, "%Y-%m-%d")
        query = query.filter(Transaction.timestamp <= end_date)
    if category:
        query = query.filter_by(category=category)
    if type_:
        query = query.filter_by(type=type_)

    limit = int(request.args.get('limit', 10))
    offset = int(request.args.get('offset', 0))
    query = query.order_by(Transaction.timestamp.desc()).limit(limit).offset(offset)

    transactions = query.all()

    result = [
        {
            "id": t.id,
            "amount": t.amount,
            "type": t.type,
            "category": t.category,
            "description": t.description,
            "timestamp": t.timestamp.isoformat()
        }
        for t in transactions
    ]

    return jsonify(result)


# -------------------------
# GET /summary
# -------------------------
@app.route('/summary', methods=['GET'])
def get_summary():
    transactions = Transaction.query.all()

    income = sum(t.amount for t in transactions if t.type.lower() == "income")
    expense = sum(t.amount for t in transactions if t.type.lower() == "expense")
    balance = income - expense

    return jsonify({
        "income": income,
        "expense": expense,
        "balance": balance
    })


# -------------------------
# GET /monthly-summary
# -------------------------
@app.route("/monthly-summary", methods=["GET"])
def get_monthly_summary():
    month_str = request.args.get("month")
    if not month_str:
        return jsonify({"error": "Missing 'month' query param (format: YYYY-MM)"}), 400

    try:
        year, month = map(int, month_str.split("-"))
    except:
        return jsonify({"error": "Invalid month format. Use YYYY-MM"}), 400

    results = db.session.query(
        Transaction.category,
        func.sum(Transaction.amount)
    ).filter(
        extract("year", Transaction.timestamp) == year,
        extract("month", Transaction.timestamp) == month
    ).group_by(Transaction.category).all()

    summary = {category: float(total) for category, total in results}

    return jsonify({
        "month": month_str,
        "summary": summary
    })
# -------------------------
# GET /monthly-summary-category
# -------------------------
@app.route('/summary-by-category')
def summary_by_category():
    summary_data = db.session.query(
        extract('year', Transaction.timestamp).label('year'),
        extract('month', Transaction.timestamp).label('month'),
        Transaction.category,
        func.sum(Transaction.amount)
    ).filter(Transaction.type == 'expense') \
     .group_by('year', 'month', Transaction.category) \
     .all()

    summary = {}
    for year, month, category, total in summary_data:
        key = f"{int(year):04d}-{int(month):02d}"
        if key not in summary:
            summary[key] = {}
        summary[key][category] = float(total)

    return jsonify(summary)

# -------------------------
# GET /balance
# -------------------------
@app.route('/balance')
def get_balance():
    transactions = Transaction.query.all()

    income = sum(t.amount for t in transactions if t.type.lower() == "income")
    expense = sum(t.amount for t in transactions if t.type.lower() == "expense")
    balance = income - expense

    return {
        "income": income,
        "expense": expense,
        "balance": balance
    }


# -------------------------
# Run the app
# -------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
