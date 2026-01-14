import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/**
 * Enables right-click panning and wheel zoom
 */
export function enableMovement({
  camera,
  renderer,
  minZoom = 0.5,
  maxZoom = 5.0,
  zoomSpeed = 0.001
}) {
  const dom = renderer.domElement;

  let isPanning = false;
  const lastMouse = new THREE.Vector2();

  /* -----------------------------
     Disable Context Menu
  ------------------------------ */
  dom.addEventListener("contextmenu", (e) => e.preventDefault());

  /* -----------------------------
     Right Mouse Pan
  ------------------------------ */
  dom.addEventListener("pointerdown", (e) => {
    if (e.button !== 2) return; // right mouse only
    isPanning = true;
    lastMouse.set(e.clientX, e.clientY);
  });

  dom.addEventListener("pointerup", () => {
    isPanning = false;
  });

  dom.addEventListener("pointermove", (e) => {
    if (!isPanning) return;

    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;

    const viewWidth = camera.right - camera.left;
    const viewHeight = camera.top - camera.bottom;

    camera.position.x -= (dx / dom.clientWidth) * viewWidth;
    camera.position.y += (dy / dom.clientHeight) * viewHeight;

    lastMouse.set(e.clientX, e.clientY);
  });

  /* -----------------------------
     Mouse Wheel Zoom
  ------------------------------ */
  dom.addEventListener("wheel", (e) => {
    e.preventDefault();

    const zoomFactor = 1 + e.deltaY * zoomSpeed;
    camera.zoom = THREE.MathUtils.clamp(
      camera.zoom / zoomFactor,
      minZoom,
      maxZoom
    );
    camera.updateProjectionMatrix();
  }, { passive: false });
}
