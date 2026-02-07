export function setupSimulationButton(onStart) {
  const btn = document.getElementById("startSim");
  btn.addEventListener("click", () => {
    onStart();
  });}

const metaPanel  = document.getElementById("metaPanel");

export function updateSimulationValues(simulationValues) {
  document.getElementById("clockValueRow").textContent              = simulationValues["clock"]
  document.getElementById("sentPacketNumberRow").textContent        = simulationValues["sentPacketNumber"]
  document.getElementById("receivedPacketNumberRow").textContent    = simulationValues["receivedPacketNumber"]
  document.getElementById("abortedPacketNumberRow").textContent     = simulationValues["abortedPacketNumber"]
}