import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";


export function createLabels(people) {
  return people.map(person => {
    const el = document.createElement("div");
    el.textContent = person.name;
    el.style.position = "absolute";
    el.style.color = "white";
    el.style.fontSize = "8px";
    el.style.pointerEvents = "none";
    el.style.marginBottom = "16px"
    document.body.appendChild(el);
    return el;
  });
}

export function updateLabels(labels, geometry, camera, renderer) {
  const pos = geometry.attributes.position;

  for (let i = 0; i < labels.length; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);

    const v = new THREE.Vector3(x, y, 0).project(camera);

    labels[i].style.left =
      ((v.x + 1) / 2) * renderer.domElement.clientWidth + "px";
    labels[i].style.top =
      ((-v.y + 1) / 2) * renderer.domElement.clientHeight - 24 + "px";
  }
}
