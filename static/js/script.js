// Open instructions code
document.getElementById('read-instructions-btn').addEventListener('click', () => {
    const instructions = document.getElementById('instructions');
    if (instructions.style.display === "none") {
        instructions.style.display = "block";
    } else {
        instructions.style.display = "none";
    }
});

let allData = JSON.parse(localStorage.getItem("studentData")) || [];
let visibleCount = 20;

// Handle CSV Upload
document.getElementById("upload-csv").addEventListener("click", () => {
    const fileInput = document.getElementById("csv-upload");
    if (fileInput.files.length === 0) {
        alert("Please select a CSV file first!");
        return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const csvData = e.target.result;
        const parsedData = parseCSV(csvData);
        allData = parsedData; 
        localStorage.setItem("studentData", JSON.stringify(allData)); 
        renderTable(); 
    };

    reader.readAsText(file);
});

// Parse CSV data
function parseCSV(csv) {
    const rows = csv.split("\n").map(row => row.split(","));
    const headers = rows[0]; 
    const data = rows.slice(1); 

    return data.map(row => {
        const item = {};
        headers.forEach((header, index) => {
            item[header.trim()] = row[index]?.trim() || "";
        });
        return item;
    });
}

// Reload button
const refreshPageButton = document.querySelector(".reload-page-btn");
refreshPageButton.addEventListener("click", () => {
    window.location.href = "./";
});

// Apply filters
function applyFilters() {
    const studentId = document.getElementById("student-id").value.trim();
    const className = document.getElementById("student-class").value.trim().toLowerCase().replace(/\s+/g, '');
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const minTime = document.getElementById("min-time").value;

    return allData.filter(item => {
        let match = true;
        const itemClass = item.CLASS.toLowerCase().replace(/\s+/g, '');
        const itemDate = new Date(item.DATE);

        if (startDate && itemDate.getTime() < new Date(startDate).getTime()) {
            match = false;
        }
        if (endDate && itemDate.getTime() > new Date(endDate).getTime()) {
            match = false;
        }
        if (studentId && item.TRNO !== studentId) match = false;
        if (className && !itemClass.includes(className)) match = false;
        if (minTime && parseFloat(item.TIME) < parseFloat(minTime)) match = false;

        return match;
    });
}

// Render table
function renderTable() {
    const tbody = document.getElementById("student-data");
    tbody.innerHTML = "";

    const filtered = applyFilters(); 

    if (filtered.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6'>No data found</td></tr>";
        return;
    }

    const userTimeMap = {};
    filtered.forEach(item => {
        const id = item.TRNO;
        const time = parseFloat(item.TIME);
        if (!userTimeMap[id]) userTimeMap[id] = 0;
        userTimeMap[id] += isNaN(time) ? 0 : time;
    });

    const visibleData = filtered.slice(0, visibleCount);

    visibleData.forEach(item => {
        const row = document.createElement("tr");
        const totalTime = userTimeMap[item.TRNO]?.toFixed(0) || "0";
        
        row.innerHTML = `
            <td>${item.TRNO}</td>
            <td>${item.DATE}</td>
            <td>${item.TIME}</td>
            <td>${item.CLASS}</td>
            <td>${item.FULLNAME}</td>
            <td>${totalTime}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById("load-more").style.display =
        filtered.length > visibleCount ? "block" : "none";
}

// Filter & Load More
document.getElementById("apply-filters").addEventListener("click", () => {
    visibleCount = 20;
    renderTable();
});

document.getElementById("load-more").addEventListener("click", () => {
    visibleCount += 20;
    renderTable();
});

// Back to top
let scrollTopButton = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
    scrollTopButton.style.display = window.scrollY >= 500 ? "block" : "none";
});

scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("scroll-to-bottom").addEventListener("click", () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});

// CSV Download (Client-Side, matches PDF filters)
document.getElementById('download-csv').addEventListener('click', () => {
    const filtered = applyFilters();

    if (!filtered.length) {
        alert("No data to export.");
        return;
    }

    const userTimeMap = {};
    filtered.forEach(item => {
        const id = item.TRNO;
        const t = parseFloat(item.TIME);
        if (!userTimeMap[id]) userTimeMap[id] = 0;
        userTimeMap[id] += isNaN(t) ? 0 : t;
    });

    const headers = ["TRNO", "DATE", "DAILY_SCREEN_TIME(MINS)", "CLASS", "FULLNAME", "TOTAL_SCREEN_TIME(FILTERED-PERIOD)MINS"];
    const csvRows = [];
    csvRows.push(headers.join(','));

    filtered.forEach(item => {
        csvRows.push([
            `"${item.TRNO}"`,
            `"${item.DATE}"`,
            `"${item.TIME}"`,
            `"${item.CLASS}"`,
            `"${item.FULLNAME}"`,
            `"${userTimeMap[item.TRNO]?.toFixed(0) || "0"}"`
        ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.href = url;
    a.download = `student_report_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// PDF Download
document.getElementById('download-pdf').addEventListener('click', async () => {
    const filtered = applyFilters();

    if (!filtered.length) {
        alert("No data to export.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");

    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const className = document.getElementById("student-class").value.trim();
    const studentId = document.getElementById("student-id").value.trim();

    doc.setFontSize(18);
    doc.text("Student Login Report", 40, 20);

    if (startDate || endDate || className) {
        let label = "Period: ";
        if (startDate || endDate) {
            label += `${startDate || "N/A"} to ${endDate || "N/A"}`;
        }
        if (className) {
            label += ` | Class: ${className.toUpperCase()}`;
        }
        doc.setFontSize(12);
        doc.text(label, 40, 30);
    }

    let headers, rows;

    if (studentId) {
        headers = [["TRNO", "DATE", "TIME", "CLASS", "FULLNAME"]];
        rows = filtered.map(item => [
            item.TRNO,
            item.DATE,
            item.TIME,
            item.CLASS,
            item.FULLNAME
        ]);

        const totalTime = filtered.reduce((sum, item) => {
            const t = parseFloat(item.TIME);
            return sum + (isNaN(t) ? 0 : t);
        }, 0);

        doc.setFontSize(12);
        doc.text(`Total Time for TRNO ${studentId}: ${totalTime.toFixed(0)} minutes`, 40, 40);

        doc.autoTable({
            head: headers,
            body: rows,
            startY: 50,
            theme: "striped",
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 102, 204] },
            margin: { top: 60 }
        });
    } else {
        const userTimeMap = {};
        filtered.forEach(item => {
            const id = item.TRNO;
            const t = parseFloat(item.TIME);
            if (!userTimeMap[id]) userTimeMap[id] = 0;
            userTimeMap[id] += isNaN(t) ? 0 : t;
        });

        headers = [["TRNO", "DATE", "DAILY_SCREEN_TIME(MINS)", "CLASS", "FULLNAME", "TOTAL_SCREEN_TIME(FILTERED-PERIOD)MINS"]];
        rows = filtered.map(item => [
            item.TRNO,
            item.DATE,
            item.TIME,
            item.CLASS,
            item.FULLNAME,
            userTimeMap[item.TRNO]?.toFixed(0) || "0"
        ]);

        doc.autoTable({
            head: headers,
            body: rows,
            startY: 50,
            theme: "striped",
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 102, 204] },
            margin: { top: 60 }
        });
    }

    doc.save(`student_report_${new Date().toISOString()}.pdf`);
});

// Clear Data
document.getElementById("delete-data").addEventListener("click", () => {
    allData = [];  
    localStorage.removeItem("studentData");
    renderTable(); 
});
