// Spectator Crowd Component
// Manages 3D participant characters (male and female) with distinct hair, outfits, walking, sitting, and speech

import * as THREE from 'three';

export const MALE_PARTICIPANTS = [
  'Anh Tuan',
  'Hoang Long',
  'Quoc Huy',
  'Bao Nam',
  'Duc Minh',
  'Quang Hai',
  'Tuan Kiet',
  'Viet Anh'
];

export const FEMALE_PARTICIPANTS = [
  'Linh Dan',
  'Mai Phuong',
  'Thuy Tien',
  'Minh Chau',
  'Ngoc Anh',
  'Thu Ha',
  'Huong Giang',
  'Yen Nhi'
];

const MALE_CLOTHING_COLORS = [
  0x1e3a8a, // Deep navy
  0x047857, // Forest emerald
  0xb91c1c, // Crimson
  0x334155, // Charcoal slate
  0x2563eb  // Royal blue
];

const FEMALE_CLOTHING_COLORS = [
  0xf43f5e, // Rose pink
  0xa855f7, // Lavender purple
  0xfb7185, // Coral
  0x2dd4bf, // Mint turquoise
  0xf472b6  // Pastel magenta
];

const HAIR_COLORS = [
  0x1a1a24, // Jet black
  0x3d2314, // Chestnut brown
  0x523927, // Dark mocha
  0xb45309  // Amber caramel
];

export const SYSTEM_SPEECH_PHRASES = [
  'Phao hoa dep qua!',
  'Qua nay mau ruc ro that!',
  'Sang ruc ca goc troi!',
  'Lap lanh nhu sao bang vay!',
  'Dinh qua ca nha oi!',
  'Ban tiep nua di nao!',
  'Goc nay ngam tuyet voi luon!',
  'Hieu ung lieu ru xuat sac!',
  'Tuyet pham luon moi nguoi oi!'
];

export class SpectatorCrowd {
  constructor(options = {}) {
    this.group = new THREE.Group();
    this.position = options.position || new THREE.Vector3(0, 4.0, 415);
    this.characters = [];
    this.viewerMap = new Map();
    this.speechTimer = options.speechTimer || 4.0;
    this.enableAutoSpeech = options.enableAutoSpeech !== undefined ? options.enableAutoSpeech : false;
    this.slotCount = options.slotCount !== undefined ? options.slotCount : 2;

    this.group.position.copy(this.position);
    this.initCrowd();
  }

  initCrowd() {
    const slotCount = this.slotCount;
    // Curated uncluttered viewing slots at the railing and terrace
    const frontRowSlots = [
      { x: -2.4, z: -13.8 },
      { x: 2.4, z: -13.8 }
    ];
    const backRowSlots = [
      { x: 0.0, z: -11.5, seated: true },
      { x: -3.8, z: -12.4 },
      { x: 3.8, z: -12.4 },
      { x: -1.2, z: -13.9 },
      { x: 1.2, z: -13.9 },
      { x: -2.3, z: -11.2, seated: true }
    ];
    const poolSlots = [...frontRowSlots, ...backRowSlots];
    const allSlots = poolSlots.slice(0, slotCount);
    while (allSlots.length < slotCount) {
      allSlots.push({
        x: (Math.random() - 0.5) * 6.0,
        z: -13.8 + Math.random() * 2.5
      });
    }

    for (let i = 0; i < slotCount; i++) {
      const isFemale = i % 2 === 1;
      const gender = isFemale ? 'female' : 'male';
      const namePool = isFemale ? FEMALE_PARTICIPANTS : MALE_PARTICIPANTS;
      const colorPool = isFemale ? FEMALE_CLOTHING_COLORS : MALE_CLOTHING_COLORS;

      const name = namePool[Math.floor(i * 0.5) % namePool.length];
      const color = colorPool[Math.floor(i * 0.5) % colorPool.length];
      const hairColor = HAIR_COLORS[i % HAIR_COLORS.length];

      const slot = allSlots[i];
      const x = slot.x + (Math.random() - 0.5) * 0.15;
      const z = slot.z + (Math.random() - 0.5) * 0.15;

      const char = this.createCharacter(x, z, color, hairColor, name, gender);
      if (slot.seated) {
        this.sitDown(char);
      }
      this.characters.push(char);
      this.group.add(char.group);
      this.viewerMap.set(name.toLowerCase(), i);
    }
  }

  createCharacter(x, z, clothingColor, hairColor, name, gender = 'male') {
    const isFemale = gender === 'female';
    const charGroup = new THREE.Group();
    charGroup.position.set(x, 0, z);
    charGroup.rotation.y = Math.PI;

    // 1. Legs & Skirt/Pants
    const legRadius = isFemale ? 0.065 : 0.085;
    const legGeo = new THREE.CylinderGeometry(legRadius, legRadius + 0.01, 0.85, 8);
    const legMat = new THREE.MeshStandardMaterial({
      color: isFemale ? 0x0f172a : 0x1e293b,
      roughness: 0.8
    });

    const legSpacing = isFemale ? 0.11 : 0.15;
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-legSpacing, 0.85, 0);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(0, -0.42, 0);
    leftLegGroup.add(leftLeg);
    charGroup.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(legSpacing, 0.85, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0, -0.42, 0);
    rightLegGroup.add(rightLeg);
    charGroup.add(rightLegGroup);

    // Optional skirt for female characters
    let skirt = null;
    if (isFemale) {
      const skirtGeo = new THREE.CylinderGeometry(0.20, 0.36, 0.42, 10);
      const skirtMat = new THREE.MeshStandardMaterial({
        color: clothingColor,
        roughness: 0.65
      });
      skirt = new THREE.Mesh(skirtGeo, skirtMat);
      skirt.position.set(0, 0.84, 0);
      charGroup.add(skirt);
    }

    // 2. Torso
    const torsoW = isFemale ? 0.38 : 0.50;
    const torsoH = isFemale ? 0.65 : 0.74;
    const torsoD = isFemale ? 0.22 : 0.28;
    const torsoGeo = new THREE.BoxGeometry(torsoW, torsoH, torsoD);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: clothingColor,
      roughness: 0.65,
      metalness: 0.15
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 1.2, 0);
    charGroup.add(torso);

    // 3. Head & Hair
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.74, 0);

    const headGeo = new THREE.SphereGeometry(isFemale ? 0.16 : 0.18, 12, 12);
    const skinMat = new THREE.MeshStandardMaterial({
      color: isFemale ? 0xffe0bd : 0xffdbac,
      roughness: 0.7
    });
    const head = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(head);

    // Hair styling: female gets ponytail or long hair; male gets short styled hair
    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.85
    });

    const hairCapGeo = new THREE.SphereGeometry(
      isFemale ? 0.175 : 0.19,
      10,
      10,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.55
    );
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.02, 0);
    headGroup.add(hairCap);

    if (isFemale) {
      // Long hair back lock falling down behind shoulders
      const longHairGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.52, 8);
      const longHair = new THREE.Mesh(longHairGeo, hairMat);
      longHair.position.set(0, -0.22, -0.06);
      longHair.rotation.x = -0.1;
      headGroup.add(longHair);

      // Cute ponytail bun
      const bunGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const bun = new THREE.Mesh(bunGeo, hairMat);
      bun.position.set(0, 0.14, -0.16);
      headGroup.add(bun);
    } else {
      // Male modern fringe / front hair lock
      const fringeGeo = new THREE.BoxGeometry(0.24, 0.08, 0.14);
      const fringe = new THREE.Mesh(fringeGeo, hairMat);
      fringe.position.set(0, 0.14, 0.10);
      headGroup.add(fringe);
    }

    headGroup.rotation.x = -0.38 + (Math.random() - 0.5) * 0.10;
    charGroup.add(headGroup);

    // 4. Arms
    const armRadius = isFemale ? 0.055 : 0.07;
    const armGeo = new THREE.CylinderGeometry(armRadius, armRadius, 0.65, 8);
    const armMat = new THREE.MeshStandardMaterial({
      color: clothingColor,
      roughness: 0.7
    });

    const armSpacing = isFemale ? 0.27 : 0.33;
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-armSpacing, 1.48, 0);
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(0, -0.3, 0);
    leftArmGroup.add(leftArm);
    charGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(armSpacing, 1.48, 0);
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0, -0.3, 0);
    rightArmGroup.add(rightArm);
    charGroup.add(rightArmGroup);

    // 5. 3D Floating Name Tag
    const nameTag = this.createNameTagSprite(name, isFemale);
    nameTag.position.set(0, 2.25, 0);
    charGroup.add(nameTag);

    // 6. 3D Speech Bubble Sprite (Larger & higher for high visibility)
    const speechBubble = this.createSpeechBubbleSprite();
    speechBubble.position.set(0, 3.25, 0);
    speechBubble.scale.set(0.001, 0.001, 0.001);
    charGroup.add(speechBubble);

    return {
      group: charGroup,
      gender: gender,
      headGroup: headGroup,
      leftArmGroup: leftArmGroup,
      rightArmGroup: rightArmGroup,
      leftLegGroup: leftLegGroup,
      rightLegGroup: rightLegGroup,
      torso: torso,
      skirt: skirt,
      nameTag: nameTag,
      speechBubble: speechBubble,
      name: name,
      baseY: 0,
      baseHeadRotX: headGroup.rotation.x,
      state: 'watching',
      stateTimer: 5 + Math.random() * 8,
      cheerTimer: 0,
      speechTimer: 0,
      targetPos: new THREE.Vector3(x, 0, z),
      walkSpeed: isFemale ? 1.6 : 1.9,
      walkPhase: 0,
      phaseOffset: Math.random() * Math.PI * 2
    };
  }

  createNameTagSprite(text, isFemale = false) {
    if (typeof document === 'undefined') {
      const dummyMat = new THREE.SpriteMaterial({ transparent: true });
      const sprite = new THREE.Sprite(dummyMat);
      sprite.userData = { canvas: null, ctx: null, texture: null };
      return sprite;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    this.drawNameTagCanvas(
      ctx,
      canvas.width,
      canvas.height,
      text,
      false,
      isFemale
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.6, 1.0);
    sprite.userData = { canvas, ctx, texture, isFemale };
    return sprite;
  }

  createSpeechBubbleSprite() {
    if (typeof document === 'undefined') {
      const dummyMat = new THREE.SpriteMaterial({ transparent: true });
      const sprite = new THREE.Sprite(dummyMat);
      sprite.userData = { canvas: null, ctx: null, texture: null };
      return sprite;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.userData = { canvas, ctx, texture };
    return sprite;
  }

  drawNameTagCanvas(ctx, width, height, text, isCelebrating, isFemale = false) {
    ctx.clearRect(0, 0, width, height);

    if (isCelebrating) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
      ctx.strokeStyle = '#fde047';
    } else if (isFemale) {
      ctx.fillStyle = 'rgba(136, 19, 55, 0.90)';
      ctx.strokeStyle = '#f472b6';
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.strokeStyle = '#38bdf8';
    }
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.roundRect(10, 10, width - 20, height - 20, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isCelebrating ? '#000000' : '#ffffff';
    ctx.font = 'bold 38px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width * 0.5, height * 0.5);
  }

  drawSpeechBubbleCanvas(ctx, width, height, text, senderName = null) {
    ctx.clearRect(0, 0, width, height);

    const pad = 12;
    const bodyH = height - 48;

    // High contrast dark frosted bubble body (slate dark)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.roundRect(pad, pad, width - pad * 2, bodyH, 28);
    ctx.fill();
    ctx.stroke();

    // Small speech tail pointing down
    ctx.beginPath();
    ctx.moveTo(width * 0.5 - 20, pad + bodyH);
    ctx.lineTo(width * 0.5, height - 6);
    ctx.lineTo(width * 0.5 + 20, pad + bodyH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (senderName) {
      // Line 1: Sender Name in bright sky cyan
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      let displayName = senderName;
      if (displayName.length > 24) {
        displayName = displayName.substring(0, 22) + '...';
      }
      ctx.fillText(displayName, width * 0.5, pad + bodyH * 0.32);

      // Line 2: Comment in bold crisp white
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      let displayComment = text;
      if (displayComment.length > 30) {
        displayComment = displayComment.substring(0, 28) + '...';
      }
      ctx.fillText(displayComment, width * 0.5, pad + bodyH * 0.70);
    } else {
      // Single line text (e.g. system speech or gift phrase)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      let display = text;
      if (display.length > 32) {
        display = display.substring(0, 30) + '...';
      }
      ctx.fillText(display, width * 0.5, pad + bodyH * 0.5);
    }
  }

  showSpeech(char, text, duration = 6.0, senderName = null) {
    char.speechTimer = duration;
    const bubble = char.speechBubble;
    if (bubble && bubble.userData.ctx) {
      const { ctx, canvas, texture } = bubble.userData;
      this.drawSpeechBubbleCanvas(
        ctx,
        canvas.width,
        canvas.height,
        text,
        senderName
      );
      texture.needsUpdate = true;
      bubble.scale.set(5.2, 1.3, 1.0);
    }
  }

  updateNameTag(char, newName, isCelebrating = false) {
    char.name = newName;
    const tag = char.nameTag;
    if (tag && tag.userData.ctx) {
      const { ctx, canvas, texture, isFemale } = tag.userData;
      this.drawNameTagCanvas(ctx, canvas.width, canvas.height, newName, isCelebrating, isFemale);
      texture.needsUpdate = true;
    }
  }

  onViewerAction(user, data = {}) {
    const rawName = user?.nickname || user?.name || 'Viewer';
    const cleanName = rawName.trim();
    const key = cleanName.toLowerCase();

    let charIndex = this.viewerMap.get(key);

    if (charIndex === undefined) {
      // Check typical female name markers in Vietnamese
      const femaleKeywords = ['linh', 'mai', 'phuong', 'tien', 'chau', 'anh', 'ha', 'nhi', 'yen', 'trang', 'nga', 'thao', 'lan'];
      const wantsFemale = femaleKeywords.some((w) => key.includes(w));

      // Find matching gender slot if available
      const matchingIndices = this.characters
        .map((c, idx) => ({ c, idx }))
        .filter((item) => (wantsFemale ? item.c.gender === 'female' : item.c.gender === 'male'))
        .map((item) => item.idx);

      if (matchingIndices.length > 0) {
        charIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
      } else {
        charIndex = Math.floor(Math.random() * this.characters.length);
      }
      this.viewerMap.set(key, charIndex);
    }

    const char = this.characters[charIndex];
    if (char) {
      char.state = 'cheering';
      char.cheerTimer = 3.5;
      this.standUp(char);
      this.updateNameTag(char, cleanName, true);

      if (data.comment) {
        this.showSpeech(char, data.comment, 6.0, cleanName);
      } else if (data.giftName) {
        this.showSpeech(char, 'Tang ' + data.giftName + '!', 4.5, cleanName);
      }
    }
  }

  standUp(char) {
    const isFemale = char.gender === 'female';
    const legSpacing = isFemale ? 0.11 : 0.15;
    char.leftLegGroup.rotation.x = 0;
    char.rightLegGroup.rotation.x = 0;
    char.leftLegGroup.position.set(-legSpacing, 0.85, 0);
    char.rightLegGroup.position.set(legSpacing, 0.85, 0);
    char.torso.position.y = 1.2;
    if (char.skirt) {
      char.skirt.position.y = 0.84;
    }
    char.headGroup.position.y = 1.74;
    char.leftArmGroup.position.y = 1.48;
    char.rightArmGroup.position.y = 1.48;
    char.nameTag.position.y = 2.25;
    char.speechBubble.position.y = 3.25;
    char.group.position.y = char.baseY;
  }

  sitDown(char) {
    const isFemale = char.gender === 'female';
    const legSpacing = isFemale ? 0.11 : 0.15;
    char.state = 'sitting';
    char.stateTimer = 10 + Math.random() * 14;

    char.leftLegGroup.rotation.x = -Math.PI * 0.45;
    char.rightLegGroup.rotation.x = -Math.PI * 0.45;
    char.leftLegGroup.position.set(-legSpacing, 0.38, 0.1);
    char.rightLegGroup.position.set(legSpacing, 0.38, 0.1);

    char.torso.position.y = 0.58;
    if (char.skirt) {
      char.skirt.position.y = 0.36;
    }
    char.headGroup.position.y = 1.12;
    char.headGroup.rotation.x = -0.45;
    char.leftArmGroup.position.y = 0.86;
    char.rightArmGroup.position.y = 0.86;
    char.leftArmGroup.rotation.x = -0.2;
    char.rightArmGroup.rotation.x = -0.2;

    char.nameTag.position.y = 1.55;
    char.speechBubble.position.y = 2.45;
  }

  pickRandomWalkTarget(char) {
    const targetX = (Math.random() - 0.5) * 6.6;
    const targetZ = -13.8 + Math.random() * 3.0;
    char.targetPos.set(targetX, 0, targetZ);
    char.state = 'walking';
    char.stateTimer = 10.0;
  }

  update(deltaTime) {
    const time = Date.now() * 0.0025;

    if (this.enableAutoSpeech) {
      this.speechTimer -= deltaTime;
      if (this.speechTimer <= 0) {
        this.speechTimer = 8.0 + Math.random() * 8.0;
        const speaker = this.characters[Math.floor(Math.random() * this.characters.length)];
        if (speaker && speaker.speechTimer <= 0) {
          const phrase = SYSTEM_SPEECH_PHRASES[Math.floor(Math.random() * SYSTEM_SPEECH_PHRASES.length)];
          this.showSpeech(speaker, phrase, 3.5);
        }
      }
    }

    for (const char of this.characters) {
      if (char.speechTimer > 0) {
        char.speechTimer -= deltaTime;
        if (char.speechTimer <= 0) {
          char.speechBubble.scale.set(0.001, 0.001, 0.001);
        }
      }

      if (char.cheerTimer > 0) {
        char.cheerTimer -= deltaTime;

        const jumpPhase = time * 8 + char.phaseOffset;
        char.group.position.y = char.baseY + Math.max(0, Math.sin(jumpPhase) * 0.38);

        char.leftArmGroup.rotation.z = 2.6 + Math.sin(jumpPhase * 1.5) * 0.3;
        char.rightArmGroup.rotation.z = -2.6 - Math.sin(jumpPhase * 1.5) * 0.3;
        char.headGroup.rotation.x = -0.55;

        if (char.cheerTimer <= 0) {
          char.state = 'watching';
          char.stateTimer = 6 + Math.random() * 6;
          this.updateNameTag(char, char.name, false);
          char.leftArmGroup.rotation.z = 0;
          char.rightArmGroup.rotation.z = 0;
          char.group.position.y = char.baseY;
          char.headGroup.rotation.x = char.baseHeadRotX;
        }
        continue;
      }

      char.stateTimer -= deltaTime;
      if (char.stateTimer <= 0) {
        if (char.state === 'watching') {
          const roll = Math.random();
          if (roll < 0.45) {
            this.pickRandomWalkTarget(char);
          } else if (roll < 0.75) {
            this.sitDown(char);
          } else {
            char.stateTimer = 5 + Math.random() * 8;
          }
        } else if (char.state === 'sitting') {
          this.standUp(char);
          char.state = 'watching';
          char.stateTimer = 8 + Math.random() * 8;
        } else if (char.state === 'walking') {
          this.standUp(char);
          char.state = 'watching';
          char.stateTimer = 6 + Math.random() * 10;
        }
      }

      if (char.state === 'walking') {
        const currentPos = char.group.position;
        const dx = char.targetPos.x - currentPos.x;
        const dz = char.targetPos.z - currentPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.3) {
          char.group.rotation.y = Math.atan2(dx, dz);

          const step = Math.min(char.walkSpeed * deltaTime, dist);
          currentPos.x = THREE.MathUtils.clamp(currentPos.x + (dx / dist) * step, -4.5, 4.5);
          currentPos.z = THREE.MathUtils.clamp(currentPos.z + (dz / dist) * step, -14.2, -11.5);

          char.walkPhase += deltaTime * 7.5;
          char.leftLegGroup.rotation.x = Math.sin(char.walkPhase) * 0.55;
          char.rightLegGroup.rotation.x = -Math.sin(char.walkPhase) * 0.55;
          char.group.position.y = char.baseY + Math.abs(Math.sin(char.walkPhase)) * 0.08;

          char.leftArmGroup.rotation.x = -Math.sin(char.walkPhase) * 0.45;
          char.rightArmGroup.rotation.x = Math.sin(char.walkPhase) * 0.45;
        } else {
          this.standUp(char);
          char.group.rotation.y = Math.PI;
          char.state = 'watching';
          char.stateTimer = 6 + Math.random() * 10;
        }
      } else if (char.state === 'sitting') {
        const breath = Math.sin(time + char.phaseOffset) * 0.02;
        char.torso.position.y = 0.58 + breath * 0.5;
        char.headGroup.position.y = 1.12 + breath;
      } else {
        const breath = Math.sin(time + char.phaseOffset) * 0.03;
        char.torso.position.y = 1.2 + breath * 0.5;
        char.headGroup.position.y = 1.74 + breath;
        char.headGroup.rotation.x = char.baseHeadRotX + Math.sin(time * 0.8 + char.phaseOffset) * 0.04;

        char.leftArmGroup.rotation.z = Math.sin(time * 0.5 + char.phaseOffset) * 0.04;
        char.rightArmGroup.rotation.z = -Math.sin(time * 0.5 + char.phaseOffset) * 0.04;
      }
    }
  }
}
