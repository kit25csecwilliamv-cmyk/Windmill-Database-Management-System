```javascript
const STORAGE_KEY = "windmillDatabase";

const form = document.getElementById("windmillForm");
const table = document.getElementById("windmillTable");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const submitButton = document.getElementById("submitButton");

let windmills = loadWindmills();

function loadWindmills() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveWindmills() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(windmills));
        return true;
    } catch {
        alert("Unable to save records. Browser storage may be full or disabled.");
        return false;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function renderWindmills() {
    const search = searchInput.value.trim().toLowerCase();
    const statusFilter = filterStatus.value;

    const filtered = windmills.filter(windmill => {
        const matchesSearch = [
            windmill.id,
            windmill.name,
            windmill.location,
            windmill.status
        ].some(value => String(value).toLowerCase().includes(search));

        const matchesStatus =
            statusFilter === "All" || windmill.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    table.innerHTML = "";

    if (filtered.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    No windmill records found.
                </td>
            </tr>
        `;
    }

    filtered.forEach(windmill => {
        const row = document.createElement("tr");

        const statusClass = {
            Active: "active",
            Maintenance: "maintenance",
            Inactive: "inactive"
        }[windmill.status] || "inactive";

        row.innerHTML = `
            <td>${escapeHTML(windmill.id)}</td>
            <td>${escapeHTML(windmill.name)}</td>
            <td>${escapeHTML(windmill.location)}</td>
            <td>${Number(windmill.capacity).toLocaleString()}</td>
            <td>${Number(windmill.power).toLocaleString()}</td>
            <td>
                <span class="badge ${statusClass}">
                    ${escapeHTML(windmill.status)}
                </span>
            </td>
            <td>${escapeHTML(windmill.maintenanceDate || "Not recorded")}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-button"
                            data-action="edit"
                            data-id="${escapeHTML(windmill.id)}">
                        Edit
                    </button>
                    <button class="delete-button"
                            data-action="delete"
                            data-id="${escapeHTML(windmill.id)}">
                        Delete
                    </button>
                </div>
            </td>
        `;

        table.appendChild(row);
    });

    updateDashboard();
    document.getElementById("recordCount").textContent =
        `${filtered.length} of ${windmills.length} records shown`;
}

function updateDashboard() {
    document.getElementById("totalWindmills").textContent =
        windmills.length;

    document.getElementById("activeWindmills").textContent =
        windmills.filter(w => w.status === "Active").length;

    document.getElementById("maintenanceWindmills").textContent =
        windmills.filter(w => w.status === "Maintenance").length;

    const totalPower = windmills.reduce(
        (sum, windmill) => sum + Number(windmill.power || 0),
        0
    );

    document.getElementById("totalPower").textContent =
        totalPower.toLocaleString(undefined, {
            maximumFractionDigits: 2
        });
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const editId = document.getElementById("editId").value;
    const id = document.getElementById("windmillId").value.trim();
    const name = document.getElementById("windmillName").value.trim();
    const location = document.getElementById("location").value.trim();
    const capacity = Number(document.getElementById("capacity").value);
    const power = Number(document.getElementById("power").value);
    const status = document.getElementById("status").value;
    const maintenanceDate =
        document.getElementById("maintenanceDate").value;

    if (!id || !name || !location) {
        alert("Please fill in all required fields.");
        return;
    }

    if (!Number.isFinite(capacity) || capacity <= 0 ||
        !Number.isFinite(power) || power < 0) {
        alert("Enter a valid capacity and power output.");
        return;
    }

    if (power > capacity) {
        alert("Power output cannot exceed the windmill's rated capacity.");
        return;
    }

    const duplicate = windmills.some(w =>
        w.id.toLowerCase() === id.toLowerCase() && w.id !== editId
    );

    if (duplicate) {
        alert("A windmill with this ID already exists.");
        return;
    }

    const windmill = {
        id,
        name,
        location,
        capacity,
        power,
        status,
        maintenanceDate
    };

    const previousWindmills = [...windmills];

    if (editId) {
        windmills = windmills.map(w =>
            w.id === editId ? windmill : w
        );
    } else {
        windmills.push(windmill);
    }

    if (!saveWindmills()) {
        windmills = previousWindmills;
        return;
    }

    form.reset();
    document.getElementById("editId").value = "";
    submitButton.textContent = "Add Windmill";

    renderWindmills();

    alert(editId
        ? "Windmill record updated successfully!"
        : "Windmill added successfully!");
});

table.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        editWindmill(id);
    }

    if (action === "delete") {
        deleteWindmill(id);
    }
});

function editWindmill(id) {
    const windmill = windmills.find(w => w.id === id);

    if (!windmill) return;

    document.getElementById("editId").value = windmill.id;
    document.getElementById("windmillId").value = windmill.id;
    document.getElementById("windmillName").value = windmill.name;
    document.getElementById("location").value = windmill.location;
    document.getElementById("capacity").value = windmill.capacity;
    document.getElementById("power").value = windmill.power;
    document.getElementById("status").value = windmill.status;
    document.getElementById("maintenanceDate").value =
        windmill.maintenanceDate || "";

    submitButton.textContent = "Update Windmill";

    document.getElementById("windmillForm").scrollIntoView({
        behavior: "smooth"
    });
}

function deleteWindmill(id) {
    const windmill = windmills.find(w => w.id === id);

    if (!windmill) return;

    if (!confirm(`Delete windmill "${windmill.name}"?`)) {
        return;
    }

    const previousWindmills = [...windmills];

    windmills = windmills.filter(w => w.id !== id);

    if (!saveWindmills()) {
        windmills = previousWindmills;
        return;
    }

    renderWindmills();
    alert("Windmill record deleted successfully!");
}

document.getElementById("resetButton").addEventListener("click", function() {
    document.getElementById("editId").value = "";
    submitButton.textContent = "Add Windmill";
});

searchInput.addEventListener("input", renderWindmills);
filterStatus.addEventListener("change", renderWindmills);

document.getElementById("exportButton").addEventListener("click", function() {
    if (windmills.length === 0) {
        alert("No records available to export.");
        return;
    }

    const columns = [
        ["id", "Windmill ID"],
        ["name", "Windmill Name"],
        ["location", "Location"],
        ["capacity", "Capacity (kW)"],
        ["power", "Power (kW)"],
        ["status", "Status"],
        ["maintenanceDate", "Last Maintenance Date"]
    ];

    const csvEscape = value =>
        '"' + String(value ?? "").replace(/"/g, '""') + '"';

    const csv = [
        columns.map(column => csvEscape(column[1])).join(","),
        ...windmills.map(windmill =>
            columns.map(column => csvEscape(windmill[column[0]])).join(",")
        )
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "windmill_database.csv";
    link.click();

    URL.revokeObjectURL(url);
});

renderWindmills();
```
