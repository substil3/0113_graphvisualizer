const metaPanel  = document.getElementById("metaPanel");
const startSimBtn = document.getElementById("startSim");
const senderIdInput = document.getElementById("senderId");
const receiverIdInput = document.getElementById("receiverId");
const sendPacketButton = document.getElementById("sendPacket");
let sendPacketType = "REQ";

export function logMessage(text) {
  const el = document.getElementById("console");
  el.textContent = text;
}

export function setupSimulationButton(onStart) {
  startSimBtn.addEventListener("click", () => {
    onStart();
  });
}

export function setupSendPacketForm(sendPacket, senderId = 0, receiverId = null) {
  sendPacketButton.addEventListener("click", () => {
    const from = Number(senderIdInput.value);
    const to = Number(receiverIdInput.value);

    if (Number.isNaN(to)) {
      logMessage("Invalid target node id");
      return;
    }

    sendPacket(from, to, sendPacketType);
  });
  senderIdInput.value = senderId;
  if(receiverId) receiverIdInput.value = receiverId;
}

export function putSenderId(id) {
  senderIdInput.value = id;
}

export function putReceiverId(id) {
  receiverIdInput.value = id;
}

export function updateSimulationValues(simulationValues) {
  document.getElementById("clockValueRow").textContent              = simulationValues["clock"]
  document.getElementById("sentPacketNumberRow").textContent        = simulationValues["sentPacketNumber"]
  document.getElementById("receivedPacketNumberRow").textContent    = simulationValues["receivedPacketNumber"]
  document.getElementById("abortedPacketNumberRow").textContent     = simulationValues["abortedPacketNumber"]
}

export function updatePlayerPanel({ name, health, cost }) {
  document.getElementById("playerNameRow").textContent = name;
  document.getElementById("playerCostRow").textContent = cost;

  const bar = document.getElementById("playerHealthBar");
  bar.innerHTML = "";

  const MAX_HEALTH = 5;

  for (let i = 0; i < MAX_HEALTH; i++) {
    const seg = document.createElement("div");
    seg.classList.add("healthSegment");

    if (i < health) {
      seg.classList.add("active");
    }

    bar.appendChild(seg);
  }
}

export function renderRoutingTableEditor(player) {
  const list = document.getElementById("routingList");
  list.innerHTML = "";

  for (const [key, value] of player.routingTable.entries()) {
    const row = document.createElement("div");
    row.className = "routingRow";

    const keySpan = document.createElement("span");
    keySpan.className = "routingKey";
    keySpan.textContent = key;

    const input = document.createElement("input");
    input.id = `route-${key}`;
    input.name = `route-${key}`;
    input.className = "routingInput";
    input.value = value;
    input.dataset.key = key;

    row.appendChild(keySpan);
    row.appendChild(input);
    list.appendChild(row);
  }
}

export function setupRoutingUpdateButton(player) {
  const btn = document.getElementById("updateRoutingBtn");

  btn.addEventListener("click", () => {
    const inputs = document.querySelectorAll("#routingList .routingInput");

    inputs.forEach((input) => {
      const key = parseInt(input.dataset.key);
      const value = parseInt(input.value);
      console.log(key, value)
      player.setRoute(key, value);
    });

    console.log("Routing table updated");
    console.log(player.routingTable)
  });
}

export function getSavedOptions() {
  return new Set(JSON.parse(sessionStorage.getItem('activeOptions') || '[]'));
}

export function setupPacketTypeToggle() {
  const buttons = document.querySelectorAll(".packetTypeButton");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const [, type] = btn.id.split(":");
      sendPacketType = type;
    });
  });

  const defaultBtn = document.getElementById("packetType:REQ");
  if (defaultBtn)
    defaultBtn.click();

  return; 
}

export function setupOptionButtonToggle() {
  const buttons = document.querySelectorAll(".optionButton");
  const saved = getSavedOptions();

  buttons.forEach((btn) => {
    if (saved.has(btn.id)) btn.classList.add("active");
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
    });
  });
  sessionStorage.removeItem('activeOptions');
  return;
}

export function setupReloadButton(reloadWorld) {
  const btn = document.getElementById("reloadWorld");
  btn.addEventListener("click", () => {
    const active = [...document.querySelectorAll(".optionButton.active")].map(b => b.id);
    sessionStorage.setItem('activeOptions', JSON.stringify(active));
    reloadWorld();
  });
}

export function setupUIElements(networkSystem, playerId) {
  setupSimulationButton(() => {
    networkSystem.runOrStopNetworkSimulation();
    if (networkSystem.simulationRunning) logMessage("simulation running")
    else logMessage("simulation stopped")
  });
  
  setupSendPacketForm((from, to, type) => {
    networkSystem.notifyPlayerSendPacket(from, to, type);
  }, playerId)
  
  renderRoutingTableEditor(networkSystem.player);
  setupRoutingUpdateButton(networkSystem.player);
  setupPacketTypeToggle();
  setupOptionButtonToggle();
  setupReloadButton(function() {
    location.href = location.href;
  })
}

export function showResultsPanel(sentHistory, receivedHistory, abortedHistory, elapsedTime) {
  const panel = document.getElementById("resultsPanel");
  document.getElementsByClassName("resultsTitle")[0].textContent += String(elapsedTime) + ")";
  panel.style.display = "block";

  const sent     = sentHistory[sentHistory.length - 1]         ?? 0;
  const received = receivedHistory[receivedHistory.length - 1] ?? 0;
  const aborted  = abortedHistory[abortedHistory.length - 1]   ?? 0;

  document.getElementById("resultSent").textContent     = sent;
  document.getElementById("resultReceived").textContent = received;
  document.getElementById("resultAborted").textContent  = aborted;

  const canvas = document.getElementById("resultsChart");
  const ctx    = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const ratioHistory = sentHistory.map((s, i) =>
    s > 0 ? receivedHistory[i] / s : 0
  );

  const series = [
    { data: sentHistory,     color: "#4da3ff", label: "Sent" },
    { data: receivedHistory, color: "#3cff00", label: "Received" },
    { data: abortedHistory,  color: "#e04343", label: "Aborted" },
  ];

  const padL = 30, padR = 28, padT = 10, padB = 46;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n      = sentHistory.length;

  const maxVal = Math.max(...series.flatMap(s => s.data), 1);

  // downsample
  const resample = (arr, maxPts) => {
    if (arr.length <= maxPts) return arr;
    const step = arr.length / maxPts;
    return Array.from({ length: maxPts }, (_, i) => arr[Math.floor(i * step)]);
  };

  // left y-axis grid lines + labels (packet counts)
  ctx.font      = "9px monospace";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const val = Math.round((maxVal * i) / 4);
    const y   = padT + chartH - (i / 4) * chartH;
    ctx.fillStyle   = "#777";
    ctx.fillText(val, padL - 4, y + 3);
    ctx.strokeStyle = i === 0 ? "#555" : "#222";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
  }

  // right y-axis labels (ratio 0%–100%)
  ctx.textAlign = "left";
  ctx.fillStyle = "#c084fc";
  for (let i = 0; i <= 4; i++) {
    const pct = Math.round((i / 4) * 100);
    const y   = padT + chartH - (i / 4) * chartH;
    ctx.fillText(`${pct}%`, padL + chartW + 4, y + 3);
  }

  // right axis line
  ctx.strokeStyle = "#4a3060";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(padL + chartW, padT);
  ctx.lineTo(padL + chartW, padT + chartH);
  ctx.stroke();

  // axes
  ctx.strokeStyle = "#555";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + chartH);
  ctx.lineTo(padL + chartW, padT + chartH);
  ctx.stroke();

  // x-axis labels (0, mid, end)
  ctx.fillStyle = "#666";
  ctx.textAlign = "center";
  [0, 0.5, 1].forEach(t => {
    const label = Math.round(t * (n - 1));
    ctx.fillText(label, padL + t * chartW, padT + chartH + 10);
  });

  // draw packet count lines (left axis scale)
  series.forEach(({ data, color }) => {
    const pts = resample(data, chartW);
    if (pts.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    pts.forEach((val, i) => {
      const x = padL + (i / (pts.length - 1 || 1)) * chartW;
      const y = padT + chartH - (val / maxVal) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  // draw ratio line (right axis scale, 0–1)
  const ratioPts = resample(ratioHistory, chartW);
  if (ratioPts.length > 0) {
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ratioPts.forEach((val, i) => {
      const x = padL + (i / (ratioPts.length - 1 || 1)) * chartW;
      const y = padT + chartH - val * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // legend
  const allLegend = [
    ...series,
    { color: "#c084fc", label: "Rcvd/Sent", dashed: true },
  ];
  ctx.font      = "9px monospace";
  ctx.textAlign = "left";
  allLegend.forEach(({ color, label, dashed }, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx  = padL + col * ((chartW) / 2);
    const ly  = H - 18 + row * 13;
    if (dashed) {
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(lx, ly - 3);
      ctx.lineTo(lx + 10, ly - 3);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly - 8, 10, 7);
    }
    ctx.fillStyle = "#aaa";
    ctx.fillText(label, lx + 13, ly);
  });
}

export function showPersonStatePanel(aliveHistory, deadHistory) {
  const panel = document.getElementById("personStatePanel");
  panel.style.display = "block";

  const alive = aliveHistory[aliveHistory.length - 1] ?? 0;
  const dead  = deadHistory[deadHistory.length - 1]   ?? 0;

  document.getElementById("resultAlive").textContent = alive;
  document.getElementById("resultDead").textContent  = dead;

  const canvas = document.getElementById("personStateChart");
  const ctx    = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const series = [
    { data: aliveHistory, color: "#3cff00", label: "Alive" },
    { data: deadHistory,  color: "#e04343", label: "Dead"  },
  ];

  const padL = 30, padR = 10, padT = 10, padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n      = aliveHistory.length;

  const maxVal = Math.max(...series.flatMap(s => s.data), 1);

  const resample = (arr, maxPts) => {
    if (arr.length <= maxPts) return arr;
    const step = arr.length / maxPts;
    return Array.from({ length: maxPts }, (_, i) => arr[Math.floor(i * step)]);
  };

  // y-axis grid + labels
  ctx.font      = "9px monospace";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const val = Math.round((maxVal * i) / 4);
    const y   = padT + chartH - (i / 4) * chartH;
    ctx.fillStyle   = "#777";
    ctx.fillText(val, padL - 4, y + 3);
    ctx.strokeStyle = i === 0 ? "#555" : "#222";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
  }

  // axes
  ctx.strokeStyle = "#555";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + chartH);
  ctx.lineTo(padL + chartW, padT + chartH);
  ctx.stroke();

  // x-axis labels
  ctx.fillStyle = "#666";
  ctx.textAlign = "center";
  [0, 0.5, 1].forEach(t => {
    const label = Math.round(t * (n - 1));
    ctx.fillText(label, padL + t * chartW, padT + chartH + 10);
  });

  // lines
  series.forEach(({ data, color }) => {
    const pts = resample(data, chartW);
    if (pts.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    pts.forEach((val, i) => {
      const x = padL + (i / (pts.length - 1 || 1)) * chartW;
      const y = padT + chartH - (val / maxVal) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  // legend
  ctx.font      = "9px monospace";
  ctx.textAlign = "left";
  series.forEach(({ color, label }, i) => {
    const lx = padL + i * ((chartW) / 2);
    const ly = H - 10;
    ctx.fillStyle = color;
    ctx.fillRect(lx, ly - 8, 10, 7);
    ctx.fillStyle = "#aaa";
    ctx.fillText(label, lx + 13, ly);
  });
}

export function disableAllActionButtons() {
  document.querySelectorAll('.simButton, .simForm').forEach(el => {
    if (!el.classList.contains('optionButton') && 
        el.id !== 'reloadWorld' &&
        el.id !== 'startSim') el.disabled = true;
  });
}