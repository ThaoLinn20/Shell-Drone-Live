// Beach Shoreline Environment Component
// Recreates the authentic seaside fireworks festival experience (Atami Hanabi style)
// with sculpted sand dunes, tactile wind/tide ripples, procedural sand texture & bump relief,
// organic curving shoreline meeting the ocean water, flush picnic mats, and warm ambient beach lighting.

import * as THREE from 'three';

export function generateProceduralSandTextures(width = 1024, height = 1024) {
  if (typeof document === 'undefined') {
    return { diffuseMap: null, bumpMap: null };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { diffuseMap: null, bumpMap: null };
  }

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d');

  ctx.fillStyle = '#423122';
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const bumpImgData = bumpCtx ? bumpCtx.getImageData(0, 0, width, height) : null;
  const bumpData = bumpImgData ? bumpImgData.data : null;

  // High-frequency pseudo-random generator with deterministic seed for stability
  let seed = 42;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const idx = (y * width + x) * 4;

      // 1. Primary Wavy Sand Ripples (horizontal wind and tidal ridges)
      const ripplePhase1 = ny * 36.0 + Math.sin(nx * 14.0) * 1.6 + Math.cos(nx * 28.0) * 0.5;
      const ripple1 = Math.sin(ripplePhase1);

      // 2. Secondary Cross Ripples
      const ripplePhase2 = ny * 72.0 + Math.sin(nx * 32.0) * 2.0;
      const ripple2 = Math.sin(ripplePhase2) * 0.42;

      // 3. Broad Dune Wave
      const duneWave = Math.sin(ny * 7.0 + Math.cos(nx * 9.0) * 1.1) * 0.35;

      // Combined tactile relief
      const wave = (ripple1 + ripple2 + duneWave) / 1.77;

      // 4. Granular Sand Noise (quartz, mineral flecks, pyrotechnic embers)
      const grain = (pseudoRandom() - 0.5) * 34;

      // 5. Footprint depressions scattered across walking paths
      const footX = (nx * 6.0) % 1.0 - 0.5;
      const footY = (ny * 4.0) % 1.0 - 0.5;
      const footDistSq = footX * footX * 4.0 + footY * footY;
      const footImpression = footDistSq < 0.12 ? -30 * (1.0 - footDistSq / 0.12) : 0;

      // Authentic Atami Nocturnal Beach Palette:
      // Trough / shadow: R: 42, G: 30, B: 20 (#2a1e14)
      // Ridge / highlight: R: 112, G: 84, B: 58 (#70543a)
      const baseR = 72 + wave * 28 + grain + footImpression;
      const baseG = 54 + wave * 22 + grain * 0.8 + footImpression * 0.8;
      const baseB = 38 + wave * 16 + grain * 0.6 + footImpression * 0.6;

      // Darkening wet sand gradient approaching the ocean shoreline
      const wetDarken = ny > 0.82 ? (ny - 0.82) / 0.18 : 0.0;
      const wetMult = 1.0 - wetDarken * 0.42;

      data[idx] = Math.max(16, Math.min(220, Math.round(baseR * wetMult)));
      data[idx + 1] = Math.max(12, Math.min(180, Math.round(baseG * wetMult)));
      data[idx + 2] = Math.max(8, Math.min(140, Math.round(baseB * wetMult)));
      data[idx + 3] = 255;

      if (bumpData) {
        const bumpVal = Math.max(
          0,
          Math.min(255, Math.round(128 + wave * 88 + grain * 0.75 + footImpression))
        );
        bumpData[idx] = bumpVal;
        bumpData[idx + 1] = bumpVal;
        bumpData[idx + 2] = bumpVal;
        bumpData[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const diffuseTexture = new THREE.CanvasTexture(canvas);
  diffuseTexture.wrapS = THREE.RepeatWrapping;
  diffuseTexture.wrapT = THREE.RepeatWrapping;
  diffuseTexture.repeat.set(8, 6);

  let bumpTexture = null;
  if (bumpCtx && bumpImgData) {
    bumpCtx.putImageData(bumpImgData, 0, 0);
    bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.set(8, 6);
  }

  return { diffuseMap: diffuseTexture, bumpMap: bumpTexture };
}

export class BeachShoreline {
  constructor(options = {}) {
    this.group = new THREE.Group();
    this.position = options.position || new THREE.Vector3(0, 0, 415);
    this.width = options.width || 92;
    this.depth = options.depth || 64;

    this.lanterns = [];
    this.mats = [];
    this.disposables = [];

    this.initStructure();
  }

  // Analytical height function for the beach terrain
  // Returns local Y coordinate for any (x, z) on the beach
  // Water level is at world Y = 0.0. Shoreline is at z ~ -16.0
  getTerrainHeightAt(x, z) {
    // Water line curves naturally along the beach
    const shorelineZ = -16.5 + Math.sin(x * 0.11) * 1.2 + Math.cos(x * 0.25) * 0.6;
    const distFromWater = z - shorelineZ;

    if (distFromWater < 0) {
      // Submerged sand bed: slopes smoothly down under the water (Y < 0.0)
      return Math.max(-1.8, distFromWater * 0.35);
    }

    // Dry sand: rises smoothly above water level (Y > 0.0) from water edge up to 2.7m at back dunes
    const t = Math.min(1.0, distFromWater / 30.0);
    const baseSlope = 0.04 + Math.pow(t, 1.15) * 2.7;

    // Organic coastal dunes and ripples
    const dune = Math.sin(x * 0.14) * 0.18 * Math.sin(Math.min(1.0, t) * Math.PI)
      + Math.cos(x * 0.28 + z * 0.15) * 0.08;
    const ripple1 = Math.sin(z * 1.5 + Math.sin(x * 0.32) * 1.2) * 0.07;
    const ripple2 = Math.cos(z * 3.2 + x * 0.45) * 0.03;

    return Math.max(0.04, baseSlope + dune + ripple1 + ripple2);
  }

  initStructure() {
    this.group.position.copy(this.position);

    // 1. Natural Sloped Sand Beach Terrain with Procedural Bump & Diffuse Relief
    this.createSandTerrain();

    // 2. Shoreline Wet Sand Reflection Strip
    this.createWetSandStrip();

    // 3. Gentle Ocean Wave Foam Line
    this.createShorelineFoam();

    // 4. Festive Hanabi Leisure Mats & Picnic Blankets
    this.createPicnicMats();

    // 5. Warm Coastal Festival Lanterns & Bamboo Posts
    this.createFestivalLanterns();

    // 6. Coastal Accent Details (Weathered driftwood & smooth stones)
    this.createCoastalAccents();

    // 7. Warm Shoreline Festival Wash Light (illuminates sand ripples and casts authentic shadows)
    this.createShorelineLighting();
  }

  createSandTerrain() {
    // 128 x 88 subdivisions for wide coverage and crisp geometric relief of ripples and dunes
    const geo = new THREE.PlaneGeometry(
      this.width,
      this.depth,
      128,
      88
    );
    this.disposables.push(geo);

    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const localY = posAttr.getY(i);
      const worldZ = -localY; // Mapping Plane local Y to 3D Z

      const elevation = this.getTerrainHeightAt(x, worldZ);
      posAttr.setZ(i, elevation);
    }
    geo.computeVertexNormals();

    const textures = generateProceduralSandTextures(1024, 1024);
    if (textures.diffuseMap) this.disposables.push(textures.diffuseMap);
    if (textures.bumpMap) this.disposables.push(textures.bumpMap);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x6e5238, // Warm rich night beach sand (Atami photo reference)
      roughness: 0.82,
      metalness: 0.06,
      map: textures.diffuseMap || null,
      bumpMap: textures.bumpMap || null,
      bumpScale: 0.24
    });
    this.disposables.push(mat);

    const terrainMesh = new THREE.Mesh(geo, mat);
    terrainMesh.rotation.x = -Math.PI * 0.5;
    terrainMesh.receiveShadow = true;
    this.group.add(terrainMesh);
  }

  createWetSandStrip() {
    // Highly reflective darker sand strip along the water edge where waves lap
    const wetGeo = new THREE.PlaneGeometry(this.width, 6.0, 64, 16);
    this.disposables.push(wetGeo);

    const posAttr = wetGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const localY = posAttr.getY(i);
      const worldZ = -15.5 - localY;
      const elevation = this.getTerrainHeightAt(x, worldZ) + 0.015;
      posAttr.setZ(i, elevation);
    }
    wetGeo.computeVertexNormals();

    const wetMat = new THREE.MeshStandardMaterial({
      color: 0x24180f, // Dark, saturated wet sand
      roughness: 0.16, // Mirror-like gloss to catch fireworks burst reflections
      metalness: 0.25,
      transparent: true,
      opacity: 0.85
    });
    this.disposables.push(wetMat);

    const wetMesh = new THREE.Mesh(wetGeo, wetMat);
    wetMesh.rotation.x = -Math.PI * 0.5;
    wetMesh.position.set(0, 0, -15.5);
    this.group.add(wetMesh);
  }

  createShorelineFoam() {
    // Soft glowing ocean wave crest along the curving shoreline
    const foamGeo = new THREE.PlaneGeometry(this.width, 1.4, 64, 4);
    this.disposables.push(foamGeo);

    const posAttr = foamGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const localY = posAttr.getY(i);
      const worldZ = -16.5 - localY;
      const elevation = this.getTerrainHeightAt(x, worldZ) + 0.025;
      posAttr.setZ(i, elevation);
    }
    foamGeo.computeVertexNormals();

    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.38
    });
    this.disposables.push(foamMat);

    const foam = new THREE.Mesh(foamGeo, foamMat);
    foam.rotation.x = -Math.PI * 0.5;
    foam.position.set(0, 0, -16.5);
    this.foamMesh = foam;
    this.group.add(foam);
  }

  createPicnicMats() {
    // Authentic Japanese Hanabi festival leisure sheets & woven tatami picnic mats
    // Sitting flush on top of the sand dunes
    const matConfigs = [
      // Front Row Near Water
      {
        x: -2.3,
        z: -13.6,
        w: 2.2,
        d: 1.8,
        color: 0x1d4ed8 // Classic cobalt blue Hanabi tarp
      },
      {
        x: 2.1,
        z: -13.6,
        w: 2.4,
        d: 1.8,
        color: 0x0284c7 // Sky blue sheet
      },
      {
        x: -0.2,
        z: -13.4,
        w: 2.0,
        d: 1.7,
        color: 0xd97706 // Straw amber rush mat
      },

      // Mid-Beach Clusters
      {
        x: -3.3,
        z: -9.2,
        w: 2.6,
        d: 2.0,
        color: 0x047857 // Forest green leisure tarp
      },
      {
        x: 3.3,
        z: -9.2,
        w: 2.6,
        d: 2.0,
        color: 0x64748b // Silver-gray thermal mat
      },
      {
        x: -1.6,
        z: -7.2,
        w: 2.2,
        d: 1.8,
        color: 0xd97706 // Amber straw mat
      },
      {
        x: 1.6,
        z: -7.2,
        w: 2.2,
        d: 1.8,
        color: 0x2563eb // Cobalt blue sheet
      },
      // Flanking Sand Mats near audience
      {
        x: -4.8,
        z: -2.0,
        w: 2.2,
        d: 1.8,
        color: 0x9333ea // Royal purple Hanabi mat
      },
      {
        x: 4.8,
        z: -2.0,
        w: 2.2,
        d: 1.8,
        color: 0x059669 // Emerald green sheet
      }
    ];

    for (const cfg of matConfigs) {
      const matGeo = new THREE.PlaneGeometry(cfg.w, cfg.d);
      this.disposables.push(matGeo);

      const matMaterial = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.82,
        metalness: 0.05
      });
      this.disposables.push(matMaterial);

      const matMesh = new THREE.Mesh(matGeo, matMaterial);
      matMesh.rotation.x = -Math.PI * 0.5 + 0.06;

      // Position flush on top of the dunes
      const terrainY = this.getTerrainHeightAt(cfg.x, cfg.z);
      matMesh.position.set(cfg.x, terrainY + 0.02, cfg.z);

      this.group.add(matMesh);
      this.mats.push(matMesh);

      const borderGeo = new THREE.RingGeometry(0.01, 0.04, 4);
      this.disposables.push(borderGeo);
    }
  }

  createFestivalLanterns() {
    // Ambient Japanese festival paper lanterns (Chochin) along coastal flanks
    const lanternPositions = [
      { x: -5.8, z: -14.2 },
      { x: 5.8, z: -14.2 },
      { x: -6.4, z: -9.8 },
      { x: 6.4, z: -9.8 },
      { x: -6.8, z: -5.5 },
      { x: 6.8, z: -5.5 },
      { x: -5.5, z: 0.5 },
      { x: 5.5, z: 0.5 },
      { x: -6.2, z: 5.5 },
      { x: 6.2, z: 5.5 }
    ];

    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
    this.disposables.push(postGeo);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Bamboo brown
      roughness: 0.75
    });
    this.disposables.push(postMat);

    const lanternGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.32, 12);
    this.disposables.push(lanternGeo);
    const lanternMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a // Warm glowing festival light
    });
    this.disposables.push(lanternMat);

    for (const pos of lanternPositions) {
      const terrainY = this.getTerrainHeightAt(pos.x, pos.z);

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(pos.x, terrainY + 0.6, pos.z);
      this.group.add(post);

      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(pos.x, terrainY + 1.15, pos.z);
      this.group.add(lantern);

      this.lanterns.push(lantern);
    }
  }

  createCoastalAccents() {
    // Natural shoreline details: weathered driftwood logs and smooth coastal stones
    const logGeo = new THREE.CylinderGeometry(0.12, 0.15, 3.4, 8);
    this.disposables.push(logGeo);
    const logMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Weathered gray driftwood
      roughness: 0.95
    });
    this.disposables.push(logMat);

    const driftLog = new THREE.Mesh(logGeo, logMat);
    driftLog.rotation.z = Math.PI * 0.48;
    driftLog.rotation.y = 0.35;
    const logY = this.getTerrainHeightAt(-5.2, -14.8);
    driftLog.position.set(-5.2, logY + 0.08, -14.8);
    this.group.add(driftLog);

    const stoneGeo = new THREE.SphereGeometry(0.24, 8, 8);
    this.disposables.push(stoneGeo);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85
    });
    this.disposables.push(stoneMat);

    const stone1 = new THREE.Mesh(stoneGeo, stoneMat);
    stone1.scale.set(1.4, 0.65, 1.1);
    const stone1Y = this.getTerrainHeightAt(4.8, -15.1);
    stone1.position.set(4.8, stone1Y + 0.05, -15.1);
    this.group.add(stone1);

    const stone2 = new THREE.Mesh(stoneGeo, stoneMat);
    stone2.scale.set(1.1, 0.55, 0.9);
    const stone2Y = this.getTerrainHeightAt(5.3, -14.7);
    stone2.position.set(5.3, stone2Y + 0.04, -14.7);
    this.group.add(stone2);
  }

  createShorelineLighting() {
    // Warm directional grazing light angled across the beach from above and behind the audience
    // to bring out deep shadows in the ripple troughs and golden highlights on the ridges
    const washLight = new THREE.DirectionalLight(0xffecd2, 1.4);
    washLight.position.set(0, 18.0, 18.0);
    washLight.target.position.set(0, 0.0, -8.0);
    this.group.add(washLight);
    this.group.add(washLight.target);
    this.washLight = washLight;

    // Warm ambient point light near the VIP lounge and seating area
    const groundLanternLight = new THREE.PointLight(
      0xfbbf24,
      0.95,
      45,
      1.4
    );
    groundLanternLight.position.set(0, 3.5, 0.0);
    this.group.add(groundLanternLight);
    this.groundLanternLight = groundLanternLight;
  }

  update(deltaTime = 0.016) {
    if (this.foamMesh && this.foamMesh.material) {
      this.foamPhase = (this.foamPhase || 0) + deltaTime * 1.8;
      this.foamMesh.material.opacity = 0.32 + Math.sin(this.foamPhase) * 0.16;
    }
  }

  dispose() {
    for (const item of this.disposables) {
      if (item && typeof item.dispose === 'function') {
        item.dispose();
      }
    }
    this.disposables = [];
    this.lanterns = [];
    this.mats = [];
  }
}
