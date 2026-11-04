// Viewing Deck Component
// Modern riverside spectator terrace and promenade where participants gather to watch fireworks

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

    // 1. Main Deck Floor (Plank deck texture/material)
    const floorGeo = new THREE.BoxGeometry(this.width, 0.4, this.depth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      roughness: 0.85,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Front boardwalk extension closer to water edge
    const frontStepGeo = new THREE.BoxGeometry(this.width, 0.35, 6);
    const frontStepMat = new THREE.MeshStandardMaterial({
      color: 0x12151c,
      roughness: 0.9,
      metalness: 0.15
    });
    const frontStep = new THREE.Mesh(frontStepGeo, frontStepMat);
    frontStep.position.set(0, -0.2, -this.depth * 0.5 - 3);
    this.group.add(frontStep);

    // 2. Front Viewing Railing (Lan can ngắm cảnh nhìn ra hồ)
    this.createRailing();

    // 3. Ambient Deck Bollard Lanterns (Đèn lồng / Đèn trụ ấm áp dọc bờ sàn)
    this.createBollardLanterns();
  }

  createRailing() {
    const railingGroup = new THREE.Group();
    const railZ = -this.depth * 0.5 - 5.8;
    const railHeight = 1.15;
    const postCount = 14;
    const spacing = (this.width - 4) / (postCount - 1);

    const postGeo = new THREE.CylinderGeometry(0.06, 0.08, railHeight, 8);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
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
      color: 0x64748b,
      roughness: 0.4,
      metalness: 0.7
    });
    const handrail = new THREE.Mesh(barGeo, barMat);
    handrail.position.set(0, railHeight - 0.2, railZ);
    railingGroup.add(handrail);

    // Mid safety cable
    const cableGeo = new THREE.BoxGeometry(this.width, 0.03, 0.03);
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set(0, railHeight * 0.5 - 0.2, railZ);
    railingGroup.add(cable);

    // Soft glowing LED strip under handrail
    const stripGeo = new THREE.BoxGeometry(this.width, 0.02, 0.04);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, railHeight - 0.25, railZ);
    railingGroup.add(strip);

    this.group.add(railingGroup);
  }

  createBollardLanterns() {
    const lanternPositions = [
      new THREE.Vector3(-this.width * 0.45, 0.4, -this.depth * 0.5),
      new THREE.Vector3(-this.width * 0.2, 0.4, -this.depth * 0.5),
      new THREE.Vector3(this.width * 0.2, 0.4, -this.depth * 0.5),
      new THREE.Vector3(this.width * 0.45, 0.4, -this.depth * 0.5)
    ];

    const bollardGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8);
    const bollardMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.5
    });

    const lightCoreGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const lightCoreMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    for (const pos of lanternPositions) {
      const base = new THREE.Mesh(bollardGeo, bollardMat);
      base.position.set(pos.x, pos.y + 0.45, pos.z);

      const core = new THREE.Mesh(lightCoreGeo, lightCoreMat);
      core.position.set(pos.x, pos.y + 0.85, pos.z);

      const pointLight = new THREE.PointLight(0xffb74d, 0.65, 12, 1.8);
      pointLight.position.set(pos.x, pos.y + 0.9, pos.z);

      this.group.add(base);
      this.group.add(core);
      this.group.add(pointLight);

      this.lanterns.push({ core, light: pointLight, baseIntensity: 0.65 });
    }
  }

  update(deltaTime) {
    // Subtle gentle flame flicker on deck lanterns
    const time = Date.now() * 0.003;
    for (let i = 0; i < this.lanterns.length; i++) {
      const item = this.lanterns[i];
      const flicker = Math.sin(time + i * 1.7) * 0.08 + Math.cos(time * 2.3 + i) * 0.05;
      item.light.intensity = item.baseIntensity + flicker;
    }
  }
}

