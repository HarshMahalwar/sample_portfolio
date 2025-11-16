const gridSize = 5;
const framesToDraw = 4;
let zoom = 0;
const zoomSpeed = 2;

const facts = [
  "BTech CSE",
  "Engineer @ MathWorks",
  "Django",
  "C++",
  "Python",
  "Qt Core",
  "Redis",
  "PostgreSQL",
  "SQLite",
  "NDS.Live",
  "MATLAB",
  "JavaScript",
  "Docker",
  "Kubernetes",
  "Cybersecurity",
  "InfoSec",
  "Cycling & Games"
];

// Store generated text textures
let factTextures = [];
let centerFacePositions = [];
let factTextureMap = {};

// Cosmic background variables
let bgG; // p5.Graphics for background texture
let stars = [];
let nebulaOffset = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(DEGREES);
  strokeWeight(3);
  noFill();
  stroke(32, 8, 8);

  // Create high-res textures for facts, always centered and semi-transparent
  for (let i = 0; i < facts.length; i++) {
    let gSize = 256;
    let g = createGraphics(gSize, gSize);
    g.pixelDensity(3);
    g.clear(); // keep texture background transparent
    g.textAlign(CENTER, CENTER);
    g.textWrap(WORD);

    // Start with a large size and shrink until it visually fits the box face width
    let fitSize = min(48, Math.floor(gSize / 8));
    g.textSize(fitSize);
    // reduce until wrapped text width fits
    while (fitSize > 10) {
      g.textSize(fitSize);
      if (g.textWidth(facts[i]) <= gSize * 0.85 || fitSize <= 12) break;
      fitSize -= 2;
    }

    // semi-transparent text color (alpha adjustable)
    const xShiftFactor = 0.1; // 0.5 = center; lower moves text left
    g.fill(32, 8, 8, 180);
    g.text(facts[i], g.width * xShiftFactor, g.height / 2, g.width * 0.8);
    factTextures.push(g);
  }

  // Calculate center positions for each face
  let mid = Math.floor(gridSize / 2);
  centerFacePositions = [
    {x: 0, y: mid, z: mid}, // -X face
    {x: gridSize - 1, y: mid, z: mid}, // +X face
    {x: mid, y: 0, z: mid}, // -Y face
    {x: mid, y: gridSize - 1, z: mid}, // +Y face
    {x: mid, y: mid, z: 0}, // -Z face
    {x: mid, y: mid, z: gridSize - 1} // +Z face
  ];

  // Assign each center-face position a specific fact texture (one-to-one)
  factTextureMap = {};
  for (let i = 0; i < centerFacePositions.length; i++) {
    const pos = centerFacePositions[i];
    const key = `${pos.x},${pos.y},${pos.z}`;
    factTextureMap[key] = factTextures[i % factTextures.length];
  }

  bgG = createGraphics(windowWidth, windowHeight);
  bgG.pixelDensity(1);
}


function drawNebula(g, t) {
  // layered colored blobs using noise -> create soft nebula
  g.noStroke();
  for (let layer = 0; layer < 5; layer++) {
    let cx = g.width * (0.2 + 0.6 * noise(t * 0.0003 + layer));
    let cy = g.height * (0.3 + 0.4 * noise(t * 0.0004 + layer + 5));
    let maxR = g.width * (0.25 + layer * 0.08);
    let hue = map(layer, 0, 4, 200, 320);
    let alphaBase = map(layer, 0, 4, 30, 80);
    for (let i = 0; i < 80; i++) {
      let r = maxR * pow(random(), 1.6);
      let ang = random(TWO_PI);
      let px = cx + cos(ang) * r * random(0.2, 1.0);
      let py = cy + sin(ang) * r * random(0.2, 1.0);
      let rad = random(40, 220);
      let a = alphaBase * (1 - r / maxR) * 0.9;
      g.fill(hue - random(10, 40), 80, 90, a);
      g.ellipse(px, py, rad, rad);
    }
  }
}

function renderBackground(t) {
  // draw radial gradient base
  bgG.clear();
  // use HSB for richer nebula colors
  bgG.colorMode(HSB, 360, 100, 100, 255);
  for (let r = 0; r < 1; r += 0.01) {
    let v = lerp(10, 25, r);
    let a = map(r, 0, 1, 30, 180);
    bgG.fill(210 + r * 40, 40, v, a);
    let w = bgG.width * (1 - r);
    let h = bgG.height * (1 - r);
    bgG.ellipse(bgG.width / 2, bgG.height / 2, w, h);
  }

  // nebula
  drawNebula(bgG, t + 1000);
  // subtle noise overlay
  bgG.push();
  bgG.noStroke();
  bgG.fill(260, 20, 95, 10);
  for (let i = 0; i < 2000; i++) {
    let x = random(bgG.width);
    let y = random(bgG.height);
    bgG.ellipse(x, y, random(0.5, 1.5));
  }
  bgG.pop();

  // draw stars with twinkle and slight parallax (we'll animate depth by nebulaOffset)
  bgG.push();
  bgG.noStroke();
  for (let s of stars) {
    let tw = (sin((millis() * 0.004 * (1 / s.depth)) + s.twinkleSeed) + 1) * 0.5;
    let size = s.baseSize * (0.6 + tw * 1.4);
    let alpha = map(tw, 0, 1, 100, 255) * (0.9 + 0.1 * (1 - s.depth));
    bgG.fill(60, 0, 100, alpha); // white-ish (in HSB)
    bgG.ellipse(s.x + sin((t + s.twinkleSeed) * 0.0008) * 1.5, s.y + cos((t + s.twinkleSeed) * 0.0006) * 1.5, size, size);
  }
  bgG.pop();

  // reset color mode
  bgG.colorMode(RGB, 255);
}

function draw() {
  // update nebula offset/time
  nebulaOffset += 0.4;

  // clear GL buffer to dark (will be overlaid by textured plane)
  background(10, 10, 10);

  // render background graphics (animated)
  renderBackground(nebulaOffset);

  // draw bgG as a textured plane far behind the cubes so it always looks like background
  push();
  // place plane behind everything; make it very large so it fills view at any FOV
  translate(0, 0, -5000);
  rotateX(0);
  noStroke();
  texture(bgG);
  plane(max(width, height) * 40, max(width, height) * 40);
  pop();

  // interactive camera control (user can orbit after zoom effect)
  orbitControl();

  // existing cube tunnel / endless zoom code
  let minDim = min(windowWidth, windowHeight);
  let baseCubeSize = minDim / (gridSize * 1.5);
  let baseSpacing = baseCubeSize * 1.2;
  let baseOffset = ((gridSize - 1) * baseSpacing) / 2;

  zoom += zoomSpeed;
  let cycleLength = baseSpacing * gridSize * 0.8;

  for (let frame = 0; frame < framesToDraw; frame++) {
    let frameDepth = (zoom % cycleLength) + frame * cycleLength;
    let scaleFactor = 1 + frame * 0.5;

    push();
    translate(0, 0, frameDepth);
    scale(scaleFactor);

    let factIndex = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          // Only draw cubes at the surface of the big cube
          if (
            x === 0 || x === gridSize - 1 ||
            y === 0 || y === gridSize - 1 ||
            z === 0 || z === gridSize - 1
          ) {
            push();
            translate(
              x * baseSpacing - baseOffset,
              y * baseSpacing - baseOffset,
              z * baseSpacing - baseOffset
            );
            // Show fact texture if this is a center face cube
            let isCenterFace = centerFacePositions.some(pos => pos.x === x && pos.y === y && pos.z === z);
            if (isCenterFace && factIndex < factTextures.length) {
              texture(factTextures[factIndex]);
              factIndex++;
              box(baseCubeSize);
            } else {
              // ambientMaterial(240, 220, 215);
              box(baseCubeSize);
            }
            pop();
          }
        }
      }
    }
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  bgG = createGraphics(windowWidth, windowHeight);
  bgG.pixelDensity(1);
  initStars();
}