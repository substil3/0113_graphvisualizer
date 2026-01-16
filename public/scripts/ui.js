export function setupSimulationButton(onStart) {
  const btn = document.getElementById("startSim");
  btn.addEventListener("click", () => {
    btn.disabled = true;
    onStart();
  });
}
