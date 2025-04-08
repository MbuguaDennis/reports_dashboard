from app import app, db, StudentData  # Ensure to import your app and db instance
import csv
from datetime import datetime

def populate_database():
    with open('processed_logins.csv', newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            try:
                # Convert date and time correctly
                date = datetime.strptime(row['DATE'], '%m/%d/%Y')
                time_spent = float(row['TIME'])

                # Insert into the database
                student_data = StudentData(
                    trno=row['TRNO'],
                    date=date,
                    time_spent=time_spent,
                    class_name=row['CLASS'],
                    fullname=row['FULLNAME'],
                    darajah=int(row['DARAJAH'])
                )

                # Add to the session
                db.session.add(student_data)

            except ValueError:
                continue  # Skip any rows with invalid data

        # Commit all changes to the database
        db.session.commit()
        print("Data successfully inserted into the database.")

# Wrap the function call within the app context
with app.app_context():
    populate_database()
