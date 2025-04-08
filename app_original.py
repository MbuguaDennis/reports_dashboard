from flask import Flask, jsonify, render_template, request, send_file
from flask_sqlalchemy import SQLAlchemy
import datetime
from io import StringIO, BytesIO

app = Flask(__name__)

# Database configuration (replace with your PostgreSQL credentials)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost/student_dashboard'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Define the database model for StudentData
class StudentData(db.Model):
    __tablename__ = 'student_data'

    trno = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date)
    time_spent = db.Column(db.Float)
    class_name = db.Column(db.String(50))
    fullname = db.Column(db.String(100))
    darajah = db.Column(db.Integer)

# Create the tables in the database (if they don't exist)
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template("index.html")

# Fetch data from the PostgreSQL database instead of CSV
def load_data():
    # Query the database to get all student data
    data = StudentData.query.all()
    result = []
    for row in data:
        result.append({
            "TRNO": row.trno,
            "DATE": row.date.strftime("%m/%d/%Y"),
            "TIME": row.time_spent,
            "CLASS": row.class_name,
            "FULLNAME": row.fullname,
            "DARAJAH": row.darajah
        })
    return result

@app.route('/api/data')
def api_data():
    return jsonify(load_data())

@app.route('/download-report')
def download_report():
    student_id = request.args.get("student_id", "").strip()
    start_date = request.args.get("start_date", "")
    end_date = request.args.get("end_date", "")
    min_time = request.args.get("min_time", "")
    class_name = request.args.get("class", "").strip().lower()

    data = load_data()
    filtered = []

    for item in data:
        try:
            # Parse item date from format like "4/3/2025"
            item_date = datetime.datetime.strptime(item["DATE"], "%m/%d/%Y")
        except ValueError:
            continue  # skip rows with invalid date

        match = True
        if student_id and str(item["TRNO"]) != student_id:
            match = False
        if start_date:
            try:
                start = datetime.datetime.strptime(start_date, "%Y-%m-%d")
                if item_date < start:
                    match = False
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.datetime.strptime(end_date, "%Y-%m-%d")
                if item_date > end:
                    match = False
            except ValueError:
                pass
        if min_time:
            try:
                if item["TIME"] < float(min_time):
                    match = False
            except ValueError:
                pass
        if class_name and item["CLASS"].strip().lower() != class_name:
            match = False

        if match:
            filtered.append(item)

    # Create CSV as bytes (not text)
    text_stream = StringIO()
    writer = csv.DictWriter(text_stream, fieldnames=["TRNO", "DATE", "TIME", "CLASS", "FULLNAME", "DARAJAH"])
    writer.writeheader()
    writer.writerows(filtered)

    # Encode string to bytes and wrap in BytesIO
    output = BytesIO()
    output.write(text_stream.getvalue().encode("utf-8"))
    output.seek(0)

    return send_file(
        output,
        mimetype="text/csv",
        as_attachment=True,
        download_name="filtered_report.csv"
    )

if __name__ == '__main__':
    app.run(debug=True)
