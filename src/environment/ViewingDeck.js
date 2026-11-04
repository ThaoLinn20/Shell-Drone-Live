// Viewing Deck Component
// Modern festive riverside spectator terrace and promenade with warm ambient lighting and decor

import * as THREE from 'three';

export class ViewingDeck {
  constructor(options = {}) {
    this.group = new THREE.Group();
    this.position = options.position || new THREE.Vector3(0, 3.8, 415);
    this.width = options.width || 60;
    this.depth = options.depth || 28;
    this.height = options.height || 4.2;

    this.lanterns = [];
    this.initStructure();
  }

  initStructure() {
    this.group.position.copy(this.position);

    // 1. Warm Teak Wood Promenade Deck Floor
    const floorGeo = new THREE.BoxGeometry(this.width, 0.4, this.depth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3a2518, // Warm rich teak/mahogany wood
      roughness: 0.65,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Realistic longitudinal wood plank inlays for visual texture
    this.createWoodPlankInlays();

    // Front boardwalk step extension closer to water edge
    const frontStepGeo = new THREE.BoxGeometry(this.width, 0.35, 6);
    const frontStepMat = new THREE.MeshStandardMaterial({
      color: 0x2e1c12,
      roughness: 0.75,
      metalness: 0.1
    });
    const frontStep = new THREE.Mesh(frontStepGeo, frontStepMat);
    frontStep.position.set(0, -0.2, -this.depth * 0.5 - 3);
    this.group.add(frontStep);

    // 2. Front Viewing Railing with glowing LED strip & Festoon Fairy Lights
    this.createRailing();

    // 3. Ambient Deck Bollard Lanterns in Viewport
    this.createBollardLanterns();

    // 4. Festive Terrace Props (Planter boxes with shrubs & wooden benches)
    this.createTerraceProps();

    // 5. Warm Promenade Floor Wash Lights
    this.createFloorWashLights();
  }

  createWoodPlankInlays() {
    const plankMat1 = new THREE.MeshStandardMaterial({
      color: 0x482f1f,
      roughness: 0.68
    });
    const plankMat2 = new THREE.MeshStandardMaterial({
      color: 0x2c1b11,
      roughness: 0.72
    });

    const plankCount = 12;
    const plankWidth = 1.0;
    const plankLength = 16.0;

    for (let i = 0; i < plankCount; i++) {
      const x = (i - (plankCount - 1) * 0.5) * (plankWidth + 0.08);
      const mat = i % 2 === 0 ? plankMat1 : plankMat2;
      const plankGeo = new THREE.BoxGeometry(plankWidth, 0.04, plankLength);
      const plank = new THREE.Mesh(plankGeo, mat);
      plank.position.set(x, 0.21, -this.depth * 0.5 + plankLength * 0.5);
      plank.receiveShadow = true;
      this.group.add(plank);
    }
  }

  createRailing() {
    const railingGroup = new THREE.Group();
    const railZ = -this.depth * 0.5 - 5.8;
    const railHeight = 1.15;
    const postCount = 18;
    const spacing = (this.width - 4) / (postCount - 1);

    const postGeo = new THREE.CylinderGeometry(0.06, 0.08, railHeight, 8);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.8
    });

    for (let i = 0; i < postCount; i++) {
      const x = -this.width * 0.5 + 2 + i * spacing;
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, railHeight * 0.5 - 0.2, railZ);
      railingGroup.add(post);
    }

    // Top Handrail Bar
    const barGeo = new THREE.BoxGeometry(this.width, 0.08, 0.12);
    const barMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Warm varnished wood handrail
      roughness: 0.35,
      metalness: 0.2
    });
    const handrail = new THREE.Mesh(barGeo, barMat);
    handrail.position.set(0, railHeight - 0.2, railZ);
    railingGroup.add(handrail);

    // Mid safety cables
    const cableGeo = new THREE.BoxGeometry(this.width, 0.025, 0.025);
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const cable1 = new THREE.Mesh(cableGeo, cableMat);
    cable1.position.set(0, railHeight * 0.65 - 0.2, railZ);
    railingGroup.add(cable1);

    const cable2 = new THREE.Mesh(cableGeo, cableMat);
    cable2.position.set(0, railHeight * 0.35 - 0.2, railZ);
    railingGroup.add(cable2);

    // Warm Golden LED Under-Rail Strip
    const stripGeo = new THREE.BoxGeometry(this.width, 0.03, 0.05);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, railHeight - 0.25, railZ);
    railingGroup.add(strip);

    // Festoon Fairy String Lights draped across center railing posts
    const bulbGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    const bulbCount = 20;
    const bulbSpan = 11.0;

    for (let b = 0; b < bulbCount; b++) {
      const bx = -bulbSpan * 0.5 + (b / (bulbCount - 1)) * bulbSpan;
      const sag = Math.sin((b / (bulbCount - 1)) * Math.PI * 4) * 0.06;
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(bx, railHeight - 0.28 - sag, railZ + 0.06);
      railingGroup.add(bulb);
    }

    this.group.add(railingGroup);
  }

  createBollardLanterns() {
    // Strategic positions: 4 central lanterns inside 9:16 mobile framing, plus side lanterns
    const lanternPositions = [
      new THREE.Vector3(-4.5, 0.4, -this.depth * 0.5 + 0.5),
      new THREE.Vector3(-1.8, 0.4, -this.depth * 0.5 + 0.5),
      new THREE.Vector3(1.8, 0.4, -this.depth * 0.5 + 0.5),
      new THREE.Vector3(4.5, 0.4, -this.depth * 0.5 + 0.5),
      new THREE.Vector3(-12.0, 0.4, -this.depth * 0.5 + 0.5),
      new THREE.Vector3(12.0, 0.4, -this.depth * 0.5 + 0.5)
    ];

    const bollardGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.95, 8);
    const bollardMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917, // Dark bronze/cast iron
      roughness: 0.5,
      metalness: 0.7
    });

    const lightCoreGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.24, 8);
    const lightCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff7ed });

    for (const pos of lanternPositions) {
      const base = new THREE.Mesh(bollardGeo, bollardMat);
      base.position.set(pos.x, pos.y + 0.45, pos.z);

      const core = new THREE.Mesh(lightCoreGeo, lightCoreMat);
      core.position.set(pos.x, pos.y + 0.88, pos.z);

      const pointLight = new THREE.PointLight(0xffb74d, 0.95, 12, 1.6);
      pointLight.position.set(pos.x, pos.y + 0.92, pos.z);

      this.group.add(base);
      this.group.add(core);
      this.group.add(pointLight);

      this.lanterns.push({ core, light: pointLight, baseIntensity: 0.95 });
    }
  }

  createTerraceProps() {
    // 1. Decorative Planter Boxes with Lush Shrubs
    const planterGeo = new THREE.BoxGeometry(0.85, 0.75, 0.85);
    const planterMat = new THREE.MeshStandardMaterial({
      color: 0x291e17,
      roughness: 0.7
    });

    const shrubGeo = new THREE.DodecahedronGeometry(0.55, 1);
    const shrubMat = new THREE.MeshStandardMaterial({
      color: 0x14532d, // Deep emerald foliage
      roughness: 0.85
    });

    const fairyDotGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const fairyDotMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

    const planterPositions = [
      new THREE.Vector3(-4.8, 0.4, -10.5),
      new THREE.Vector3(4.8, 0.4, -10.5)
    ];

    for (const pos of planterPositions) {
      const planterGroup = new THREE.Group();
      planterGroup.position.copy(pos);

      const box = new THREE.Mesh(planterGeo, planterMat);
      box.position.set(0, 0.38, 0);
      planterGroup.add(box);

      const shrub = new THREE.Mesh(shrubGeo, shrubMat);
      shrub.position.set(0, 0.95, 0);
      planterGroup.add(shrub);

      // Embedded fairy light dots in the shrub
      for (let f = 0; f < 6; f++) {
        const dot = new THREE.Mesh(fairyDotGeo, fairyDotMat);
        const theta = (f / 6) * Math.PI * 2;
        dot.position.set(
          Math.sin(theta) * 0.45,
          0.95 + (f % 2) * 0.2,
          Math.cos(theta) * 0.45
        );
        planterGroup.add(dot);
      }

      this.group.add(planterGroup);
    }

    // 2. Comfortable Teak Wood Park Benches
    const benchGroup = new THREE.Group();
    const benchPositions = [
      new THREE.Vector3(-3.2, 0.4, -9.0),
      new THREE.Vector3(3.2, 0.4, -9.0)
    ];

    const seatGeo = new THREE.BoxGeometry(1.6, 0.08, 0.55);
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x5a3418, // Polished teak
      roughness: 0.45
    });

    const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.5);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.6,
      metalness: 0.8
    });

    for (const bPos of benchPositions) {
      const bench = new THREE.Group();
      bench.position.copy(bPos);

      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.set(0, 0.48, 0);
      bench.add(seat);

      const leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.position.set(-0.65, 0.23, 0);
      bench.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.position.set(0.65, 0.23, 0);
      bench.add(rightLeg);

      this.group.add(bench);
    }
  }

  createFloorWashLights() {
    // Warm golden ambient floor wash illuminating the promenade and characters
    const washLight1 = new THREE.PointLight(0xffaa33, 1.4, 15, 1.5);
    washLight1.position.set(0, 2.2, -10.0);
    this.group.add(washLight1);

    const washLight2 = new THREE.PointLight(0xff9800, 1.2, 14, 1.6);
    washLight2.position.set(0, 1.8, -13.5);
    this.group.add(washLight2);

    this.lanterns.push({
      light: washLight1,
      baseIntensity: 1.4
    });
    this.lanterns.push({
      light: washLight2,
      baseIntensity: 1.2
    });
  }

  update(deltaTime) {
    // Subtle gentle flame flicker on deck lanterns and wash lights
    const time = Date.now() * 0.003;
    for (let i = 0; i < this.lanterns.length; i++) {
      const item = this.lanterns[i];
      if (item && item.light) {
        const flicker = Math.sin(time + i * 1.7) * 0.06 + Math.cos(time * 2.3 + i) * 0.04;
        item.light.intensity = item.baseIntensity + flicker;
      }
    }
  }
}
