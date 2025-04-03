import pandas as pd

# Step 1: Read the text file
file_path = "student_logins.txt"

with open(file_path, "r") as file:
    lines = file.readlines()

# Step 2: Process and clean the data
data = []
for line in lines:
    parts = line.strip().split()  # Split by space
    if len(parts) >= 4:  # Ensure there are enough columns
        username = parts[0]  # First column is Username
        date = parts[1]  # Second column is Date
        time_spent = float(parts[2])  # Third column is Time
        data.append([username, date, time_spent])  # Store clean data

# Step 3: Save to CSV
df = pd.DataFrame(data, columns=["Username", "Date", "Time_Minutes"])
df.to_csv("processed_logins.csv", index=False)

print("Data processing complete! Saved as processed_logins.csv.")
