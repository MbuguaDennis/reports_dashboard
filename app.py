from flask import Flask, render_template, jsonify
import os

app = Flask(__name__, static_folder="static", template_folder="templates")

# Dummy function to simulate data fetching
def get_student_data():
    data = []
    file_path = os.path.join(os.getcwd(), "processed_logins.csv")  # Ensure correct path
    if os.path.exists(file_path):
        with open(file_path, "r") as file:
            for line in file:
                parts = line.strip().split(",")  # Assuming CSV format
                if len(parts) >= 3:
                    student_id, date, time_spent = parts[0], parts[1], parts[2]
                    try:
                        time_spent = float(time_spent)
                        data.append({"student_id": student_id, "date": date, "time_spent": time_spent})
                    except ValueError:
                        continue
    return data

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/data", methods=["GET"])
def api_data():
    return jsonify(get_student_data())

if __name__ == "__main__":
    app.run(debug=True)
