from api import app, db
from models import Transaction  

with app.app_context():
    db.create_all()
    print("Database initialized.")
