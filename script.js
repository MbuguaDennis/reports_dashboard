document.addEventListener("DOMContentLoaded", () => {
    let originalData = [];
    let displayedData = [];
    let currentIndex = 0;
    const pageSize = 10; // Number of rows to show per load
    const tableBody = document.getElementById("student-data");
    function fetchData() {
        fetch('/api/data')
            .then(response => response.json())
            .then(data => {
                originalData = data;
                displayedData = data.slice(0, pageSize);
                currentIndex = pageSize;
                renderTable(displayedData);
                toggleLoadMoreButton();
            })
            .catch(error => console.error("Error fetching data:", error));
    }
    function renderTable(data) {
        tableBody.innerHTML = "";
        data.forEach(item => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.student_id}</td>
                <td>${item.date}</td>
                <td>${item.time_spent.toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function applyFilters() {
        let studentId = document.getElementById("student-id").value.trim();
        let startDate = document.getElementById("start-date").value;
        let endDate = document.getElementById("end-date").value;
        let minTime = document.getElementById("min-time").value;

        let filteredData = originalData.filter(item => {
            let match = true;

            if (studentId && item.student_id !== studentId) {
                match = false;
            }
            if (startDate && new Date(item.date) < new Date(startDate)) {
                match = false;
            }
            if (endDate && new Date(item.date) > new Date(endDate)) {
                match = false;
            }
            if (minTime && item.time_spent < parseFloat(minTime)) {
                match = false;
            }

            return match;
        });

        displayedData = filteredData.slice(0, pageSize);
        currentIndex = pageSize;
        renderTable(displayedData);
        toggleLoadMoreButton();
    }

    function loadMoreData() {
        let nextBatch = originalData.slice(currentIndex, currentIndex + pageSize);
        displayedData = displayedData.concat(nextBatch);
        currentIndex += pageSize;
        renderTable(displayedData);
        toggleLoadMoreButton();
    }
    function toggleLoadMoreButton() {
        let loadMoreBtn = document.getElementById("load-more");
        if (currentIndex >= originalData.length) {
            loadMoreBtn.style.display = "none";
        } else {
            loadMoreBtn.style.display = "block";
        }
    }
    function exportCSV() {
        let csvContent = "Student ID,Date,Time Spent\n";
        displayedData.forEach(item => {
            csvContent += `${item.student_id},${item.date},${item.time_spent.toFixed(2)}\n`;
        });
        let blob = new Blob([csvContent], { type: "text/csv" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "filtered_report.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function downloadFilteredPDF() {
        let studentId = document.getElementById("student-id").value.trim();
        let startDate = document.getElementById("start-date").value;
        let endDate = document.getElementById("end-date").value;
        let minTime = document.getElementById("min-time").value;
        let url = `/download-report?student_id=${encodeURIComponent(studentId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&min_time=${encodeURIComponent(minTime)}`;
        window.location.href = url;
    }
    document.getElementById("apply-filters").addEventListener("click", applyFilters);
    document.getElementById("export-data").addEventListener("click", exportCSV);
    document.getElementById("load-more").addEventListener("click", loadMoreData);
    document.getElementById("download-pdf").addEventListener("click", downloadFilteredPDF);
    fetchData();

    // Back to top and scroll to bottom features
    const backToTop = document.getElementById('back-to-top');
    const scrollToBottom = document.getElementById("scroll-to-bottom");
    
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            backToTop.style.display = "block";
        } else {
            backToTop.style.display = "none";
        }
    });

    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    scrollToBottom.addEventListener("click", () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
});
// download data input
// generate random number between 
let randomNumber = Math.floor(Math.random() * 10) + 3;  // Random number between 3 and 12
const downloadData = document.getElementById("data-download");
downloadData.setAttribute("placeholder", randomNumber);  // Set the placeholder attribute


