import pandas as pd
# Step 1: Read the cleaned text file (without "minutes" column)
file_path = "student_logins.txt"

with open(file_path, "r") as file:
    lines = file.readlines()

# Step 2: Process and clean the data
data = []
for line in lines:
    parts = line.strip().split()  # Split by space
    if len(parts) == 3:  # Now we expect exactly 3 parts: ID, date, time
        username = parts[0]
        date = parts[1]
        try:
            time_spent = float(parts[2])  # Validate time is a number
            data.append([username, date, time_spent])
        except ValueError:
            continue  # Skip if time is not a number

# Step 3: Save to CSV
df = pd.DataFrame(data, columns=["Username", "Date", "Time_Minutes"])
df.to_csv("processed_logins.csv", index=False)

print("✅ Data processing complete! Saved as processed_logins.csv.")
