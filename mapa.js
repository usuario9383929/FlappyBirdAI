export function renderMapa(container) {
  drawSun(container);
  drawAllClouds(container);
  drawGround(container);
}

/* ---------- SOL ---------- */
function drawSun(container) {
  const sun = div({
    width: "90px",
    height: "90px",
    right: "30px",
    top: "30px",
    borderRadius: "50%",
    background: "radial-gradient(circle,#fff9c4,#ffd54f)"
  });
  container.appendChild(sun);
}

/* ---------- NUVENS ---------- */
function drawAllClouds(container) {
  cloud(container, 120, 180);
  cloud(container, 420, 240);
  cloud(container, 650, 140);
}

function cloud(container, x, y) {
  const parts = [
    [0, 0, 70],
    [50, -25, 60],
    [-40, -15, 55]
  ];

  for (const [dx, dy, s] of parts) {
    container.appendChild(div({
      left: (x + dx) + "px",
      top: (y + dy) + "px",
      width: s + "px",
      height: s + "px",
      borderRadius: "50%",
      background: "white"
    }));
  }
}

/* ---------- GRAMA ---------- */
function drawGround(container) {
  const ground = div({
    bottom: "0",
    left: "0",
    width: "100%",
    height: "110px",
    background: "#5aa25a",
    borderTop: "6px solid #3f7a3f"
  });
  container.appendChild(ground);
}

/* ---------- HELPER ---------- */
function div(styleObj) {
  const d = document.createElement("div");
  d.style.position = "absolute";
  for (const k in styleObj) d.style[k] = styleObj[k];
  return d;
}