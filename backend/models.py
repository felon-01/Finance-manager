# models.py
from datetime import datetime
from storage import db  # ✅ no circular import
from werkzeug.security import generate_password_hash, check_password_hash
from storage import db
# (not from api)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    type = db.Column(db.String(10))  # income or expense
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Transaction {self.id}: ₹{self.amount} | {self.category} | {self.type} | {self.timestamp}>"



    def to_dict(self):
       return {
        "id": self.id,
        "amount": self.amount,
        "category": self.category,
        "description": self.description,
        "type": self.type,
        "timestamp": self.timestamp.isoformat()  # ✅ ensures T format
    }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)    
