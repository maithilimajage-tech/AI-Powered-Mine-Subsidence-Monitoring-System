/* ==========================================
   INITIALIZE MAP
========================================== */
const map = L.map('mineMap').setView([16.850, 74.585], 14);

/* ==========================================
   MAP BASE LAYER & OVERLAYS
========================================== */
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const mineBoundary = [
  [16.858, 74.565], [16.865, 74.585], [16.858, 74.605],
  [16.842, 74.610], [16.835, 74.590], [16.838, 74.568]
];
L.polygon(mineBoundary, {
  color: "#00bfff", weight: 2, fillColor: "#0877c9", fillOpacity: 0.12
}).addTo(map).bindPopup("<b>Mine Monitoring Area</b><br>Subsidence monitoring zone");

const miningPanel = [
  [16.855, 74.575], [16.858, 74.590], [16.850, 74.600],
  [16.842, 74.592], [16.840, 74.575], [16.848, 74.570]
];
L.polygon(miningPanel, {
  color: "#ffb300", weight: 2, dashArray: "6,6", fillColor: "#ffb300", fillOpacity: 0.08
}).addTo(map).bindPopup("<b>Underground Mining Panel</b><br>Surface monitoring zone");

/* Risk Zones */
L.circle([16.852, 74.580], {
  radius: 850, color: "#ff4757", fillColor: "#ff4757", fillOpacity: 0.15, weight: 2
}).addTo(map).bindPopup("<b>Critical Risk Zone</b><br>High subsidence risk");

L.circle([16.847, 74.594], {
  radius: 600, color: "#ffd23f", fillColor: "#ffd23f", fillOpacity: 0.13, weight: 2
}).addTo(map).bindPopup("<b>Warning Risk Zone</b><br>Abnormal ground movement detected");

/* Dynamic Sensor Markers */
let sensorMarkers = [];

function renderMapMarkers() {
  sensorMarkers.forEach(marker => map.removeLayer(marker));
  sensorMarkers = [];

  if (typeof mineSensorData === "undefined") return;

  mineSensorData.forEach(sensor => {
    if (!sensor.lat || !sensor.lng) return;

    let color = "#00e6a1";
    if (sensor.status === "WARNING") color = "#ffd23f";
    if (sensor.status === "CRITICAL") color = "#ff4757";

    const marker = L.circleMarker([sensor.lat, sensor.lng], {
      radius: 7,
      fillColor: color,
      color: "#ffffff",
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(map);

    marker.bindPopup(`
      <b>Node ${sensor.id} (${sensor.zone})</b><br>
      Status: <span style="color:${color}">${sensor.status}</span><br>
      Tilt: ${sensor.tilt.toFixed(1)}°<br>
      Displacement: ${sensor.displacement.toFixed(1)} mm<br>
      Risk: ${sensor.risk}%
    `);

    sensorMarkers.push(marker);
  });
}

/* ==========================================
   CURRENT DATE AND TIME
========================================== */
function updateDateTime() {
  const now = new Date();
  const date = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const dateTimeEl = document.getElementById("dateTime");
  if (dateTimeEl) {
    dateTimeEl.innerText = `${date} ${time}`;
  }
}
updateDateTime();
setInterval(updateDateTime, 1000);

/* ==========================================
   SENSOR TABLE & SUMMARY CARDS
========================================== */
function loadSensorTable() {
  const table = document.getElementById("sensorTable");
  if (!table || typeof mineSensorData === "undefined") return;

  table.innerHTML = "";
  mineSensorData.forEach(sensor => {
    let statusClass = "healthy";
    if (sensor.status === "WARNING") statusClass = "warning-status";
    if (sensor.status === "CRITICAL") statusClass = "critical-status";

    table.innerHTML += `
      <tr>
        <td>${sensor.id}</td>
        <td class="${statusClass}">● ${sensor.status}</td>
        <td>${Number(sensor.tilt).toFixed(1)}</td>
        <td>${Number(sensor.displacement).toFixed(1)}</td>
        <td>${Math.round(sensor.battery)}%</td>
      </tr>
    `;
  });
}

function updateSummaryCards() {
  if (typeof mineSensorData === "undefined") return;

  const total = mineSensorData.length;
  const safe = mineSensorData.filter(s => s.status === "SAFE").length;
  const warning = mineSensorData.filter(s => s.status === "WARNING").length;
  const critical = mineSensorData.filter(s => s.status === "CRITICAL").length;

  if (document.getElementById("totalNodes")) document.getElementById("totalNodes").innerText = total;
  if (document.getElementById("healthyNodes")) document.getElementById("healthyNodes").innerText = safe;
  if (document.getElementById("warningNodes")) document.getElementById("warningNodes").innerText = warning;
  if (document.getElementById("criticalNodes")) document.getElementById("criticalNodes").innerText = critical;
}

/* ==========================================
   CHARTS INITIALIZATION
========================================== */
const labels = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00"];

if (document.getElementById("tiltChart")) {
  new Chart(document.getElementById("tiltChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        { label: "N01", data: [1.1, 1.2, 1.3, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8], tension: 0.4 },
        { label: "N03", data: [2.8, 3.2, 3.6, 4.1, 4.8, 5.2, 6.0, 5.8, 6.7], tension: 0.4 },
        { label: "N05", data: [2.0, 2.4, 2.7, 3.0, 3.5, 3.4, 3.6, 3.8, 4.3], tension: 0.4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

if (document.getElementById("displacementChart")) {
  new Chart(document.getElementById("displacementChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        { label: "N01", data: [1.8, 2.0, 2.1, 2.2, 2.3, 2.5, 2.6, 2.8, 3.0], tension: 0.4 },
        { label: "N03", data: [4.0, 4.8, 5.5, 6.2, 7.1, 7.8, 8.5, 10.0, 12.6], tension: 0.4 },
        { label: "N05", data: [5.0, 5.5, 6.0, 6.4, 6.8, 7.0, 7.5, 8.0, 8.9], tension: 0.4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

if (document.getElementById("vibrationChart")) {
  new Chart(document.getElementById("vibrationChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        { label: "N01", data: [0.12, 0.15, 0.14, 0.15, 0.16, 0.18, 0.15, 0.17, 0.15], tension: 0.4 },
        { label: "N03", data: [0.30, 0.35, 0.42, 0.48, 0.55, 0.60, 0.75, 0.68, 0.71], tension: 0.4 },
        { label: "N05", data: [0.20, 0.22, 0.25, 0.28, 0.32, 0.35, 0.38, 0.41, 0.40], tension: 0.4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

/* ==========================================
   REAL-TIME DATA SIMULATION
========================================== */
function simulateSensorData() {
  if (typeof mineSensorData === "undefined") return;

  mineSensorData.forEach(sensor => {
    sensor.tilt += (Math.random() - 0.5) * 0.4;
    sensor.displacement += (Math.random() - 0.5) * 0.8;
    sensor.vibration += (Math.random() - 0.5) * 0.08;
    sensor.crack += (Math.random() - 0.5) * 0.2;

    sensor.tilt = Math.max(0, sensor.tilt);
    sensor.displacement = Math.max(0, sensor.displacement);
    sensor.vibration = Math.max(0, sensor.vibration);
    sensor.crack = Math.max(0, sensor.crack);

    let risk = (sensor.tilt * 5) + (sensor.displacement * 3) + (sensor.vibration * 15) + (sensor.crack * 8);
    risk = Math.min(100, Math.max(0, risk));
    sensor.risk = Math.round(risk);

    if (sensor.risk < 40) {
      sensor.status = "SAFE";
    } else if (sensor.risk < 70) {
      sensor.status = "WARNING";
    } else {
      sensor.status = "CRITICAL";
    }

    sensor.battery -= Math.random() * 0.05;
    sensor.battery = Math.max(0, sensor.battery);
  });

  loadSensorTable();
  updateSummaryCards();
  renderMapMarkers();
}

/* Sidebar Interactivity */
document.querySelectorAll('.menu a').forEach(menuItem => {
  menuItem.addEventListener('click', function() {
    document.querySelectorAll('.menu a').forEach(item => item.classList.remove('active'));
    this.classList.add('active');
  });
});

// Initial Load & Simulation Loop
loadSensorTable();
updateSummaryCards();
renderMapMarkers();
setInterval(simulateSensorData, 3000);