import { logMessage } from "./console.js";

export function setupSimulationButton(onStart) {
  const btn = document.getElementById("startSim");
  btn.addEventListener("click", () => {
    onStart();
  });}

export function setupSendPacketForm(sendPacket) {
  const input = document.getElementById("receiverId");
  const sendPacketButton = document.getElementById("sendPacket");

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

const metaPanel  = document.getElementById("metaPanel");

export function updateSimulationValues(simulationValues) {
  document.getElementById("clockValueRow").textContent              = simulationValues["clock"]
  document.getElementById("sentPacketNumberRow").textContent        = simulationValues["sentPacketNumber"]
  document.getElementById("receivedPacketNumberRow").textContent    = simulationValues["receivedPacketNumber"]
  document.getElementById("abortedPacketNumberRow").textContent     = simulationValues["abortedPacketNumber"]
}