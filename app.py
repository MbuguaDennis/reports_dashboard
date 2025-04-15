from flask import Flask, jsonify, render_template, request, send_file
import csv
from io import StringIO, BytesIO
import datetime

app = Flask(__name__)

# Store uploaded data temporarily
uploaded_data = []

def parse_csv(file):
    global uploaded_data
    uploaded_data.clear()  # Clear previous data
    reader = csv.DictReader(file)
    for row in reader:
        try:
            uploaded_data.append({
                "TRNO": row["TRNO"],
                "DATE": row["DATE"],
                "TIME": float(row["TIME"]),
                "CLASS": row["CLASS"],
                "FULLNAME": row["FULLNAME"],
                "DARAJAH": row["DARAJAH"]
            })
        except ValueError:
            continue  # Skip invalid rows

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/api/data')
def api_data():
    return jsonify(uploaded_data)

@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    if 'csv_file' not in request.files:
        return "No file part", 400
    
    file = request.files['csv_file']
    
    if file.filename == '':
        return "No selected file", 400
    
    if file and file.filename.endswith('.csv'):
        parse_csv(file)
        return "CSV uploaded successfully", 200
    else:
        return "Invalid file type. Please upload a CSV file.", 400

@app.route('/download-report')
def download_report():
    student_id = request.args.get("student_id", "").strip()
    start_date = request.args.get("start_date", "")
    end_date = request.args.get("end_date", "")
    min_time = request.args.get("min_time", "")
    class_name = request.args.get("class", "").strip().lower()

    data = uploaded_data
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
