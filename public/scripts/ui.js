export function setupSimulationButton(onStart) {
  const btn = document.getElementById("startSim");
  btn.addEventListener("click", () => {
    onStart();
  });
}

const metaPanel  = document.getElementById("metaPanel");
let metaVisible = false;


export function updateSimulationValues(simulationValues) {
  document.getElementById("clockValueRow").textContent               = simulationValues["clock"]
  document.getElementById("sentPacketNumberRow").textContent        = simulationValues["sentPacketNumber"]
  document.getElementById("receivedPacketNumberRow").textContent    = simulationValues["receivedPacketNumber"]
}