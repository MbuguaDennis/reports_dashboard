from flask import Flask, jsonify, render_template, request, send_file
import csv
from io import StringIO, BytesIO
import datetime
from collections import defaultdict

app = Flask(__name__)

# Store uploaded data temporarily
uploaded_data = []

def parse_csv(file):
    global uploaded_data
    uploaded_data.clear()
    reader = csv.DictReader(file)
    for row in reader:
        try:
            date_str = row["DATE"].strip()
            uploaded_data.append({
                "TRNO": row["TRNO"].strip(),
                "DATE": date_str,
                "TIME": float(row["TIME"]),
                "CLASS": row["CLASS"].strip(),
                "FULLNAME": row["FULLNAME"].strip()
            })
        except Exception as e:
            print(f"Error parsing row: {row}, error: {e}")
            continue

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
    start_date_str = request.args.get("start_date", "")
    end_date_str = request.args.get("end_date", "")
    min_time = request.args.get("min_time", "")
    class_name = request.args.get("class", "").strip().lower()

    filtered = []

    start = None
    end = None
    if start_date_str:
        try:
            start = datetime.datetime.strptime(start_date_str, "%Y-%m-%d")
        except ValueError:
            pass
    if end_date_str:
        try:
            end = datetime.datetime.strptime(end_date_str, "%Y-%m-%d")
        except ValueError:
            pass

    for item in uploaded_data:
        try:
            item_date = datetime.datetime.strptime(item["DATE"], "%m/%d/%Y")
        except ValueError:
            continue

        match = True

        if student_id and str(item["TRNO"]) != student_id:
            match = False
        if start and item_date < start:
            match = False
        if end and item_date > end:
            match = False
        if min_time:
            try:
                if item["TIME"] < float(min_time):
                    match = False
            except ValueError:
                match = False
        if class_name and item["CLASS"].strip().lower() != class_name:
            match = False

        if match:
            filtered.append(item)

    # Calculate per-student total time
    student_totals = defaultdict(float)
    for item in filtered:
        student_totals[item["TRNO"]] += item["TIME"]

    # Create CSV content
    text_stream = StringIO()
    fieldnames = [
        "TRNO",
        "DATE",
        "Time (min)",
        "CLASS",
        "FULLNAME",
        "Filtered_Period_Student_Total_Time(mins)"
    ]
    writer = csv.DictWriter(text_stream, fieldnames=fieldnames)
    writer.writeheader()

    for item in filtered:
        writer.writerow({
            "TRNO": item["TRNO"],
            "DATE": item["DATE"],
            "Time (min)": item["TIME"],
            "CLASS": item["CLASS"],
            "FULLNAME": item["FULLNAME"],
            "Filtered_Period_Student_Total_Time(mins)": round(student_totals[item["TRNO"]], 2)
        })

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
