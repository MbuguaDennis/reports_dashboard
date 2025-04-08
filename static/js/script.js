let allData = [];
let visibleCount = 20;
async function fetchData() {
    const response = await fetch("/api/data");
    const data = await response.json();
    allData = data;
    renderTable();
}
function renderTable() {
    const tbody = document.getElementById("student-data");
    tbody.innerHTML = "";

    const filtered = applyFilters();
    const visibleData = filtered.slice(0, visibleCount);

    visibleData.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.TRNO}</td>
            <td>${item.DATE}</td>
            <td>${item.TIME}</td>
            <td>${item.CLASS}</td>
            <td>${item.FULLNAME}</td>
            <td>${item.DARAJAH}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById("load-more").style.display = 
        filtered.length > visibleCount ? "block" : "none";
}

function applyFilters() {
    const studentId = document.getElementById("student-id").value.trim();
    const className = document.getElementById("student-class").value.trim().toLowerCase();
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const minTime = document.getElementById("min-time").value;

    return allData.filter(item => {
        let match = true;
        const itemDate = new Date(item.DATE);

        if (studentId && item.TRNO !== studentId) match = false;
        if (className && item.CLASS.toLowerCase() !== className) match = false;
        if (startDate && new Date(startDate) > itemDate) match = false;
        if (endDate && new Date(endDate) < itemDate) match = false;
        if (minTime && parseFloat(item.TIME) < parseFloat(minTime)) match = false;

        return match;
    });
}

document.getElementById("apply-filters").addEventListener("click", () => {
    visibleCount = 20;
    renderTable();
});

document.getElementById("load-more").addEventListener("click", () => {
    visibleCount += 20;
    renderTable();
});

document.getElementById("back-to-top").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("scroll-to-bottom").addEventListener("click", () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});

// CSV Download
document.getElementById('download-csv').addEventListener('click', () => {
    const studentId = document.getElementById('student-id').value;
    const className = document.getElementById('student-class').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const minTime = document.getElementById('min-time').value;

    const query = new URLSearchParams({
        student_id: studentId,
        class: className,
        start_date: startDate,
        end_date: endDate,
        min_time: minTime
    });

    // Trigger file download
    window.location.href = `/download-report?${query.toString()}`;
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

    doc.setFontSize(18);
    doc.text("Student Login Report", 40, 30);

    const headers = [["TRNO", "DATE", "TIME", "CLASS", "FULLNAME", "DARAJAH"]];
    const rows = filtered.map(item => [
        item.TRNO,
        item.DATE,
        item.TIME,
        item.CLASS,
        item.FULLNAME,
        item.DARAJAH
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

    doc.save("filtered_report.pdf");
});


// Initial Load
fetchData();
