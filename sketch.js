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
    // reduce until wrapped text height <= ~70% of canvas or text width fits
    while (fitSize > 10) {
      g.textSize(fitSize);
      // draw to a temporary offscreen to measure (we can estimate with textWidth for longest line)
      // use simple heuristic based on length
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
    // if there are fewer facts than faces, reuse facts cyclically
    factTextureMap[key] = factTextures[i % factTextures.length];
  }
}

function draw() {
  background(180, 100, 100);

  orbitControl();

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
}