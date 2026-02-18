import { logMessage } from "./console.js";

const metaPanel  = document.getElementById("metaPanel");
const startSimBtn = document.getElementById("startSim");
const input = document.getElementById("receiverId");
const sendPacketButton = document.getElementById("sendPacket");

export function setupSimulationButton(onStart) {
  startSimBtn.addEventListener("click", () => {
    onStart();
  });
}

export function setupSendPacketForm(sendPacket) {
  sendPacketButton.addEventListener("click", () => {
    const to = Number(input.value);

    if (Number.isNaN(to)) {
      logMessage("Invalid target node id");
      return;
    }

    sendPacket(to);
    input.value = "";
  });
}

export function putSelectedIdToForm(id) {
  input.value = id;
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

    player.initRoutingTable(); // TODO (직접 변경은 안되나?)
    inputs.forEach((input) => {
      const key = input.dataset.key;
      const value = input.value;
      console.log(key, value)
      player.setRoute(key, value);
    });

    console.log("Routing table updated");
    console.log(player.routingTable)
  });
}