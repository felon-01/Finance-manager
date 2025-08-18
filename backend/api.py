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
from werkzeug.utils import secure_filename
import os
import uuid
import pandas as pd
import pdfplumber
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

model = joblib.load('transaction_classifier.pkl')
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Use a strong secret in production!
jwt = JWTManager(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)

from models import Transaction

# Bank Statement Parser Class
class BankStatementParser:
    def __init__(self):
        self.category_mapping = {
            'food_dining': ['restaurant', 'cafe', 'food', 'dining', 'swiggy', 'zomato', 'uber eats', 'dominos'],
            'transport': ['uber', 'ola', 'metro', 'bus', 'taxi', 'fuel', 'petrol', 'diesel', 'parking'],
            'shopping': ['amazon', 'flipkart', 'mall', 'store', 'shopping', 'myntra', 'ajio'],
            'utilities': ['electricity', 'water', 'gas', 'internet', 'mobile', 'broadband', 'wifi'],
            'entertainment': ['movie', 'netflix', 'spotify', 'game', 'theater', 'concert'],
            'healthcare': ['hospital', 'medical', 'pharmacy', 'doctor', 'clinic', 'medicine'],
            'salary': ['salary', 'wages', 'income', 'payroll', 'bonus'],
            'transfer': ['transfer', 'upi', 'neft', 'rtgs', 'imps', 'paytm', 'gpay'],
            'investment': ['mutual fund', 'sip', 'stock', 'equity', 'bond', 'fd'],
            'bills': ['bill', 'insurance', 'emi', 'loan', 'rent'],
            'cash': ['atm', 'cash withdrawal', 'cash deposit'],
            'education': ['school', 'college', 'course', 'book', 'tuition'],
            'groceries': ['grocery', 'supermarket', 'vegetables', 'fruits', 'milk']
        }
    
    def categorize_transaction(self, description):
        """Categorize transaction using ML model or keyword matching"""
        if not description:
            return 'other'
        
        try:
            # First try using your existing ML model
            predicted_category = model.predict([description])[0]
            return predicted_category
        except:
            # Fallback to keyword matching
            description_lower = description.lower()
            for category, keywords in self.category_mapping.items():
                if any(keyword in description_lower for keyword in keywords):
                    return category
            return 'other'
    
    def clean_amount(self, amount_str):
        """Clean and convert amount string to float"""
        if pd.isna(amount_str) or str(amount_str).strip() == '':
            return 0.0
        
        # Remove currency symbols, commas
        cleaned = re.sub(r'[₹$€£,\s]', '', str(amount_str))
        
        # Handle negative amounts in parentheses
        if '(' in cleaned and ')' in cleaned:
            cleaned = cleaned.replace('(', '-').replace(')', '')
        
        try:
            return float(cleaned)
        except (ValueError, TypeError):
            return 0.0
    
    def parse_date(self, date_str):
        """Parse date string to datetime object"""
        if pd.isna(date_str) or str(date_str).strip() == '':
            return None
        
        date_str = str(date_str).strip()
        formats = [
            '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d', '%d-%m-%Y',
            '%d %b %Y', '%d %B %Y', '%b %d, %Y', '%B %d, %Y',
            '%d/%m/%y', '%m/%d/%y', '%d-%m-%y'
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        return None
    
    def detect_csv_columns(self, df):
        """Detect column mappings from CSV headers"""
        columns = [col.lower().strip() for col in df.columns]
        mapping = {}
        
        # Date column
        for col in df.columns:
            col_lower = col.lower()
            if any(word in col_lower for word in ['date', 'txn date', 'transaction date']):
                mapping['date'] = col
                break
        
        # Description column
        for col in df.columns:
            col_lower = col.lower()
            if any(word in col_lower for word in ['description', 'narration', 'particulars', 'details']):
                mapping['description'] = col
                break
        
        # Amount columns
        for col in df.columns:
            col_lower = col.lower()
            if 'debit' in col_lower or 'withdrawal' in col_lower:
                mapping['debit'] = col
            elif 'credit' in col_lower or 'deposit' in col_lower:
                mapping['credit'] = col
            elif 'balance' in col_lower:
                mapping['balance'] = col
            elif 'amount' in col_lower and 'debit' not in mapping and 'credit' not in mapping:
                mapping['amount'] = col
        
        return mapping
    
    def parse_csv(self, file_path):
        """Parse CSV bank statement"""
        transactions = []
        
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            df = None
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            
            if df is None or df.empty:
                raise ValueError("Could not read CSV file")
            
            # Detect columns
            column_mapping = self.detect_csv_columns(df)
            
            if not column_mapping.get('date') or not column_mapping.get('description'):
                raise ValueError("Could not identify required columns")
            
            for _, row in df.iterrows():
                try:
                    # Parse date
                    date_str = row.get(column_mapping['date'])
                    transaction_date = self.parse_date(date_str)
                    if not transaction_date:
                        continue
                    
                    # Get description
                    description = str(row.get(column_mapping['description'], '')).strip()
                    if not description or description.lower() == 'nan':
                        continue
                    
                    # Parse amounts
                    if 'amount' in column_mapping:
                        amount = self.clean_amount(row.get(column_mapping['amount']))
                        trans_type = 'expense'  # Default
                    else:
                        debit = self.clean_amount(row.get(column_mapping.get('debit', ''), 0))
                        credit = self.clean_amount(row.get(column_mapping.get('credit', ''), 0))
                        
                        if debit > 0:
                            amount = debit
                            trans_type = 'expense'
                        elif credit > 0:
                            amount = credit
                            trans_type = 'income'
                        else:
                            continue
                    
                    if amount == 0:
                        continue
                    
                    # Categorize
                    category = self.categorize_transaction(description)
                    
                    transactions.append({
                        'description': description,
                        'amount': amount,
                        'timestamp': transaction_date,
                        'type': trans_type,
                        'category': category
                    })
                    
                except Exception as e:
                    logger.warning(f"Error processing CSV row: {e}")
                    continue
            
            return transactions
            
        except Exception as e:
            logger.error(f"CSV parsing error: {e}")
            raise
    
    def parse_pdf(self, file_path):
        """Parse PDF bank statement"""
        transactions = []
        
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            if not text:
                raise ValueError("Could not extract text from PDF")
            
            # Common transaction patterns
            patterns = [
                r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+(\d+[,.]?\d*\.?\d{2})\s*(dr|cr|debit|credit)',
                r'(\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4})\s+(.+?)\s+(\d+[,.]?\d*\.?\d{2})'
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
                
                for match in matches:
                    try:
                        date_str = match[0]
                        description = match[1] if len(match) > 1 else "Transaction"
                        amount_str = match[2] if len(match) > 2 else "0"
                        
                        date = self.parse_date(date_str)
                        if not date:
                            continue
                        
                        amount = self.clean_amount(amount_str)
                        if amount == 0:
                            continue
                        
                        # Determine type based on context
                        trans_type = 'expense'  # Default
                        if len(match) > 3:
                            type_indicator = match[3].lower()
                            if 'cr' in type_indicator or 'credit' in type_indicator:
                                trans_type = 'income'
                        
                        category = self.categorize_transaction(description)
                        
                        transactions.append({
                            'description': description.strip(),
                            'amount': amount,
                            'timestamp': date,
                            'type': trans_type,
                            'category': category
                        })
                        
                    except Exception as e:
                        logger.warning(f"Error parsing PDF transaction: {e}")
                        continue
            
            return transactions
            
        except Exception as e:
            logger.error(f"PDF parsing error: {e}")
            raise

# Initialize parser
parser = BankStatementParser()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv', 'pdf'}

# -------------------------
# POST /transactions: Add a new transaction - FIXED VERSION
# -------------------------
# -------------------------
# POST /transactions: Add a new transaction - FIXED VERSION
# -------------------------
@app.route('/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    
    # Log the incoming data for debugging
    logger.info(f"Received transaction data: {data}")
    
    description = data.get('description')
    amount = data.get('amount')
    # FIX: Accept both 'date' and 'timestamp' fields
    timestamp_str = data.get('date') or data.get('timestamp')  # Frontend sends 'date'
    trans_type = data.get('type')

    # Validate required fields
    if not description or not amount or not trans_type:
        missing_fields = []
        if not description: missing_fields.append('description')
        if not amount: missing_fields.append('amount') 
        if not trans_type: missing_fields.append('type')
        return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

    # Validate and convert amount
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid amount format'}), 400

    # Validate transaction type
    if trans_type not in ['income', 'expense']:
        return jsonify({'error': 'Type must be either "income" or "expense"'}), 400

    # Parse timestamp/date
    try:
        if timestamp_str:
            # Handle different timestamp formats from frontend
            if isinstance(timestamp_str, str):
                # Remove 'Z' suffix if present
                timestamp_str = timestamp_str.replace('Z', '')
                
                # Try parsing different date formats
                timestamp = None
                formats = [
                    '%Y-%m-%d',  # This is what your frontend sends: "2003-02-23"
                    '%Y-%m-%dT%H:%M:%S.%f',
                    '%Y-%m-%dT%H:%M:%S',
                    '%Y-%m-%d %H:%M:%S',
                    '%d/%m/%Y',
                    '%m/%d/%Y'
                ]
                
                for fmt in formats:
                    try:
                        timestamp = datetime.strptime(timestamp_str, fmt)
                        break
                    except ValueError:
                        continue
                
                if not timestamp:
                    return jsonify({'error': f'Invalid date format. Received: {timestamp_str}'}), 400
            else:
                return jsonify({'error': 'Date must be a string'}), 400
        else:
            # If no timestamp provided, use current time
            timestamp = datetime.now()
    
    except Exception as e:
        logger.error(f"Timestamp parsing error: {e}")
        return jsonify({'error': f'Date parsing failed: {str(e)}'}), 400

    # Predict category using ML model
    try:
        predicted_category = model.predict([description])[0]
        logger.info(f"ML prediction successful: {predicted_category}")
    except Exception as e:
        logger.warning(f"ML prediction failed: {e}")
        # Fallback to parser categorization
        predicted_category = parser.categorize_transaction(description)

    # Create transaction
    transaction = Transaction(
        amount=amount,
        category=predicted_category,
        timestamp=timestamp,
        type=trans_type,
        description=description
    )
    
    try:
        db.session.add(transaction)
        db.session.commit()
        
        logger.info(f"Transaction saved successfully: ID={transaction.id}")
        
        return jsonify({
            'message': 'Transaction added successfully', 
            'category': predicted_category,
            'id': transaction.id,
            'transaction': {
                'id': transaction.id,
                'description': transaction.description,
                'amount': transaction.amount,
                'type': transaction.type,
                'category': transaction.category,
                'timestamp': transaction.timestamp.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Database error: {e}")
        return jsonify({'error': f'Failed to save transaction: {str(e)}'}), 500
# -------------------------
# Bank Statement Upload and Parsing
# -------------------------
@app.route('/upload-statement', methods=['POST'])
@jwt_required()
def upload_statement():
    """Upload and parse bank statement"""
    try:
        current_user = get_jwt_identity()
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Please upload CSV or PDF files only.'}), 400
        
        # Save file securely
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        try:
            # Parse the statement
            file_extension = filename.rsplit('.', 1)[1].lower()
            
            if file_extension == 'csv':
                parsed_transactions = parser.parse_csv(file_path)
            elif file_extension == 'pdf':
                parsed_transactions = parser.parse_pdf(file_path)
            else:
                return jsonify({'error': 'Unsupported file type'}), 400
            
            # Save parsed transactions to database
            saved_count = 0
            errors = []
            
            for trans_data in parsed_transactions:
                try:
                    # Check for duplicates
                    existing = Transaction.query.filter_by(
                        description=trans_data['description'],
                        amount=trans_data['amount'],
                        timestamp=trans_data['timestamp'],
                        user_id=current_user
                    ).first()
                    
                    if existing:
                        continue  # Skip duplicates
                    
                    transaction = Transaction(
                        user_id=current_user,
                        description=trans_data['description'],
                        amount=trans_data['amount'],
                        timestamp=trans_data['timestamp'],
                        type=trans_data['type'],
                        category=trans_data['category']
                    )
                    
                    db.session.add(transaction)
                    saved_count += 1
                    
                except Exception as e:
                    errors.append(f"Error saving transaction: {str(e)}")
                    continue
            
            db.session.commit()
            
            # Clean up uploaded file
            os.remove(file_path)
            
            return jsonify({
                'success': True,
                'message': f'Successfully processed {len(parsed_transactions)} transactions',
                'saved_count': saved_count,
                'total_parsed': len(parsed_transactions),
                'errors': errors[:5]  # Return first 5 errors if any
            }), 200
            
        except Exception as parse_error:
            # Clean up file on error
            if os.path.exists(file_path):
                os.remove(file_path)
            
            logger.error(f"Statement parsing error: {parse_error}")
            return jsonify({
                'error': 'Failed to parse statement',
                'details': str(parse_error)
            }), 500
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# -------------------------
# Get parsing history
# -------------------------
@app.route('/parsing-history', methods=['GET'])
@jwt_required()
def get_parsing_history():
    """Get user's statement parsing history"""
    try:
        current_user = get_jwt_identity()
        
        # Get transactions that were parsed from statements
        parsed_transactions = Transaction.query.filter_by(user_id=current_user).all()
        
        # Group by date for history view
        history = {}
        for trans in parsed_transactions:
            date_key = trans.timestamp.strftime('%Y-%m-%d')
            if date_key not in history:
                history[date_key] = {
                    'date': date_key,
                    'transaction_count': 0,
                    'total_amount': 0,
                    'categories': set()
                }
            
            history[date_key]['transaction_count'] += 1
            history[date_key]['total_amount'] += trans.amount
            history[date_key]['categories'].add(trans.category)
        
        # Convert to list and format
        history_list = []
        for date_key in sorted(history.keys(), reverse=True):
            item = history[date_key]
            item['categories'] = list(item['categories'])
            history_list.append(item)
        
        return jsonify({
            'success': True,
            'history': history_list[:20]  # Return last 20 entries
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching parsing history: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# -------------------------
# Smart transaction insights
# -------------------------
@app.route('/transaction-insights', methods=['GET'])
@jwt_required()
def get_transaction_insights():
    """Get ML-powered transaction insights"""
    try:
        current_user = get_jwt_identity()
        transactions = Transaction.query.filter_by(user_id=current_user).all()
        
        if not transactions:
            return jsonify({'message': 'No transactions found'}), 200
        
        # Category spending analysis
        category_spending = {}
        monthly_trends = {}
        
        for trans in transactions:
            # Category analysis
            if trans.category not in category_spending:
                category_spending[trans.category] = {'total': 0, 'count': 0, 'avg': 0}
            
            category_spending[trans.category]['total'] += trans.amount
            category_spending[trans.category]['count'] += 1
            
            # Monthly trends
            month_key = trans.timestamp.strftime('%Y-%m')
            if month_key not in monthly_trends:
                monthly_trends[month_key] = {'income': 0, 'expense': 0}
            
            if trans.type == 'income':
                monthly_trends[month_key]['income'] += trans.amount
            else:
                monthly_trends[month_key]['expense'] += trans.amount
        
        # Calculate averages
        for category in category_spending:
            data = category_spending[category]
            data['avg'] = data['total'] / data['count'] if data['count'] > 0 else 0
        
        # Find top spending categories
        top_categories = sorted(
            [(cat, data['total']) for cat, data in category_spending.items() if cat != 'salary'],
            key=lambda x: x[1], reverse=True
        )[:5]
        
        # Generate insights
        insights = []
        
        if top_categories:
            insights.append({
                'type': 'spending_pattern',
                'message': f"Your highest spending category is {top_categories[0][0]} with ₹{top_categories[0][1]:.2f}",
                'category': top_categories[0][0],
                'amount': top_categories[0][1]
            })
        
        # Monthly comparison
        if len(monthly_trends) >= 2:
            months = sorted(monthly_trends.keys())
            current_month = monthly_trends[months[-1]]
            prev_month = monthly_trends[months[-2]]
            
            expense_change = ((current_month['expense'] - prev_month['expense']) / prev_month['expense'] * 100) if prev_month['expense'] > 0 else 0
            
            if abs(expense_change) > 20:
                trend = "increased" if expense_change > 0 else "decreased"
                insights.append({
                    'type': 'monthly_trend',
                    'message': f"Your expenses have {trend} by {abs(expense_change):.1f}% compared to last month",
                    'change_percent': expense_change
                })
        
        return jsonify({
            'success': True,
            'insights': insights,
            'category_breakdown': category_spending,
            'monthly_trends': monthly_trends,
            'top_categories': top_categories
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# -------------------------
# All your existing routes remain unchanged
# -------------------------

# register
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

# transactions user
@app.route('/transactions/user', methods=['GET'])
@jwt_required()
def get_user_transactions():
    current_user = get_jwt_identity()
    print(f"👤 Authenticated user ID: {current_user}")

    transactions = Transaction.query.filter_by(user_id=current_user).all()

    return jsonify([t.to_dict() for t in transactions]), 200

# login
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

# category-breakdown
@app.route('/category-breakdown')
def category_breakdown():
    txn_type = request.args.get("type", "expense")
    transactions = Transaction.query.filter_by(type=txn_type).all()

    category_totals = {}
    for txn in transactions:
        category = txn.category or "Other"
        category_totals[category] = category_totals.get(category, 0) + txn.amount

    return jsonify(category_totals)

# GET /monthly-balance savings
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

# monthly-income-expense
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

# GET /transactions
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

# GET /summary
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

# GET /monthly-summary
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

# GET /monthly-summary-category
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

# GET /balance
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

# Run the app
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)