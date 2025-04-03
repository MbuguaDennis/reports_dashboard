document.addEventListener("DOMContentLoaded", () => {
    let originalData = [];
    let filteredData = [];
    let displayedData = [];
    let displayedCount = 10; // Number of students displayed initially
    const pageSize = 10; // Load in batches of 10
    const tableBody = document.getElementById("student-data");
    const loadMoreBtn = document.getElementById("load-more");

    // Function to fetch data
    function fetchData() {
        fetch('/api/data')
            .then(response => response.json())
            .then(data => {
                originalData = data;
                filteredData = [...originalData]; // Copy of original data
                updateTable();
            })
            .catch(error => console.error("Error fetching data:", error));
    }

    // Format date to be more user-friendly
    function formatDate(dateString) {
        let date = new Date(dateString);
        return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
    }

    // Update the table with new data
    function updateTable() {
        tableBody.innerHTML = ""; // Clear table before re-rendering
        displayedData = filteredData.slice(0, displayedCount); // Show only up to displayedCount students
        renderTable(displayedData);
        toggleLoadMoreButton();
    }

    // Render the data inside the table
    function renderTable(data) {
        data.forEach(item => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.student_id}</td>
                <td>${formatDate(item.date)}</td>
                <td>${item.time_spent.toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Apply filters to the data
    function applyFilters() {
        let studentId = document.getElementById("student-id").value.trim();
        let startDate = document.getElementById("start-date").value;
        let endDate = document.getElementById("end-date").value;
        let minTime = document.getElementById("min-time").value;

        filteredData = originalData.filter(item => {
            let match = true;
            if (studentId && item.student_id !== studentId) match = false;
            if (startDate && new Date(item.date) < new Date(startDate)) match = false;
            if (endDate && new Date(item.date) > new Date(endDate)) match = false;
            if (minTime && item.time_spent < parseFloat(minTime)) match = false;
            return match;
        });

        displayedCount = 10; // Reset displayed count after filtering
        updateTable();
    }

    // Load 10 more students when clicking "Load More"
    function loadMoreData() {
        displayedCount += pageSize; // Increase displayed students by 10
        updateTable();
    }

    // Toggle the visibility of the "Load More" button
    function toggleLoadMoreButton() {
        loadMoreBtn.style.display = displayedCount >= filteredData.length ? "none" : "block";
    }

    // Export data to a PDF
    function exportPDF() {
        if (!window.jspdf) {
            console.error("jsPDF is not loaded.");
            return;
        }

        const { jsPDF } = window.jspdf;
        let doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Student Login Report", 14, 15);

        doc.setFontSize(12);
        let startY = 25;
        doc.text("Student ID", 14, startY);
        doc.text("Date", 64, startY);
        doc.text("Time Spent (Minutes)", 114, startY);

        let y = startY + 10;

        // If filters are applied, export displayedData, otherwise export all originalData
        let dataToExport = displayedData.length > 0 ? displayedData : originalData;

        if (dataToExport.length === 0) {
            alert("No data available for export.");
            return;
        }

        dataToExport.forEach(item => {
            doc.text(item.student_id.toString(), 14, y);
            doc.text(formatDate(item.date), 64, y);
            doc.text(item.time_spent.toFixed(2), 114, y);
            y += 7;
        });

        doc.save("student_login_report.pdf");
    }

    // Event listeners
    document.getElementById("apply-filters").addEventListener("click", applyFilters);
    document.getElementById("export-data").addEventListener("click", exportPDF);
    loadMoreBtn.addEventListener("click", loadMoreData);

    // Initial fetch
    fetchData();

    // Back to top button functionality
    const backToTop = document.getElementById('back-to-top');
    const scrollToBottom = document.getElementById("scroll-to-bottom");

    window.addEventListener("scroll", () => {
        backToTop.style.display = window.scrollY > 300 ? "block" : "none";
    });

    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Scroll to bottom button functionality
    scrollToBottom.addEventListener("click", () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
});
