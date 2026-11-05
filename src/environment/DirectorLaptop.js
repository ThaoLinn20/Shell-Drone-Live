import * as THREE from 'three';

export class DirectorLaptop {
  constructor(options = {}) {
    this.scheduler = options.scheduler || null;
    this.group = new THREE.Group();
    this.group.name = 'DirectorLaptopGroup';

    // Positioned right in front of camera (0, 3.20, 424.0) at lower-center foreground
    // Camera looks at (0, 68, 0). Laptop sits in lower 20% of screen.
    const posX = options.x !== undefined ? options.x : 0.0;
    const posY = options.y !== undefined ? options.y : 2.42;
    const posZ = options.z !== undefined ? options.z : 422.48;
    this.position = new THREE.Vector3(posX, posY, posZ);

    const laptopScale = options.scale !== undefined ? options.scale : 1.30;
    this.group.scale.set(laptopScale, laptopScale, laptopScale);

    this.disposables = [];
    this.canvas = null;
    this.ctx = null;
    this.screenTexture = null;
    this.lastRenderTime = 0;
    this.throttleInterval = 0.09; // 10-11 Hz update for screen canvas
    this.lastState = null;

    this._initCanvasTexture();
    this._createStructure();

    this.group.position.copy(this.position);

    // Initial render of screen
    this.renderScreen();
  }

  _initCanvasTexture() {
    if (typeof document === 'undefined') {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
    const ctx = canvas.getContext('2d');

    this.canvas = canvas;
    this.ctx = ctx;

    this.screenTexture = new THREE.CanvasTexture(canvas);
    this.screenTexture.colorSpace = THREE.SRGBColorSpace;
    this.screenTexture.generateMipmaps = false;
    this.screenTexture.minFilter = THREE.LinearFilter;
    this.screenTexture.magFilter = THREE.LinearFilter;

    this.disposables.push(this.screenTexture);
  }

  _createStructure() {
    // 1. Rustic Field Stand / Director Beach Table
    const tableW = 0.64;
    const tableD = 0.44;
    const tableH = 0.03;

    const tableGeo = new THREE.BoxGeometry(tableW, tableH, tableD);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x27272a, // Matte dark carbon-zinc
      roughness: 0.85,
      metalness: 0.2
    });
    this.disposables.push(tableGeo, tableMat);

    const tableTop = new THREE.Mesh(tableGeo, tableMat);
    tableTop.position.set(0, -0.015, 0);
    this.group.add(tableTop);

    // 4 folding legs extending into the sand
    const legGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.55, 6);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.6,
      roughness: 0.4
    });
    this.disposables.push(legGeo, legMat);

    const legOffsets = [
      [-tableW * 0.42, -tableD * 0.40],
      [tableW * 0.42, -tableD * 0.40],
      [-tableW * 0.42, tableD * 0.40],
      [tableW * 0.42, tableD * 0.40]
    ];

    for (const [lx, lz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, -0.28, lz);
      this.group.add(leg);
    }

    // 2. Laptop Lower Base Chassis
    const baseW = 0.50;
    const baseD = 0.34;
    const baseH = 0.018;

    const baseGeo = new THREE.BoxGeometry(baseW, baseH, baseD);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Anodized space grey
      roughness: 0.35,
      metalness: 0.82
    });
    this.disposables.push(baseGeo, baseMat);

    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, baseH * 0.5, 0.02);
    this.group.add(baseMesh);

    // Trackpad
    const padGeo = new THREE.BoxGeometry(0.14, 0.003, 0.09);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.9
    });
    this.disposables.push(padGeo, padMat);
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(0, baseH + 0.001, 0.10);
    this.group.add(padMesh);

    // Backlit Chiclet Keyboard Tray
    const keybW = 0.44;
    const keybD = 0.17;
    const keybGeo = new THREE.BoxGeometry(keybW, 0.004, keybD);
    const keybMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.28,
      roughness: 0.6
    });
    this.disposables.push(keybGeo, keybMat);
    const keybMesh = new THREE.Mesh(keybGeo, keybMat);
    keybMesh.position.set(0, baseH + 0.002, -0.04);
    this.group.add(keybMesh);

    // Status Indicator LED (Top right corner of chassis)
    const ledGeo = new THREE.SphereGeometry(0.006, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });
    this.disposables.push(ledGeo, ledMat);
    this.ledMesh = new THREE.Mesh(ledGeo, ledMat);
    this.ledMesh.position.set(baseW * 0.44, baseH + 0.004, -baseD * 0.44 + 0.02);
    this.group.add(this.ledMesh);

    // 3. Laptop Screen Lid & Bezel
    // Hinged near back edge (z ≈ -0.14) and tilted toward camera
    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, baseH, -baseD * 0.5 + 0.02);

    // Angle tilted backward toward the camera lens: 20 degrees from vertical
    const tiltAngle = Math.PI * 0.11; // ~19.8 degrees tilt
    screenGroup.rotation.x = tiltAngle;

    const lidW = 0.52;
    const lidH = 0.32;
    const lidThick = 0.012;

    const lidGeo = new THREE.BoxGeometry(lidW, lidH, lidThick);
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.82
    });
    this.disposables.push(lidGeo, lidMat);

    const lidMesh = new THREE.Mesh(lidGeo, lidMat);
    lidMesh.position.set(0, lidH * 0.5, 0);
    screenGroup.add(lidMesh);

    // Screen Display Plane (where CanvasTexture is rendered)
    const dispW = 0.48;
    const dispH = 0.28;
    const dispGeo = new THREE.PlaneGeometry(dispW, dispH);

    const dispMat = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      toneMapped: false,
      side: THREE.DoubleSide
    });
    this.disposables.push(dispGeo, dispMat);

    const screenDisplay = new THREE.Mesh(dispGeo, dispMat);
    // Face outward (+Z in screenGroup space)
    screenDisplay.position.set(0, lidH * 0.5, lidThick * 0.5 + 0.002);
    screenGroup.add(screenDisplay);

    this.group.add(screenGroup);

    // 4. Subtle Screen Emissive Glow
    // Soft cyan/blue point light casting glow onto keyboard & table
    this.screenLight = new THREE.PointLight(0x38bdf8, 0.45, 1.2, 2.0);
    this.screenLight.position.set(0, baseH + 0.18, 0.04);
    this.group.add(this.screenLight);

    // 5. Director Script Notes / Field Props on desk beside laptop
    const mugGeo = new THREE.CylinderGeometry(0.035, 0.032, 0.09, 12);
    const mugMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.3
    });
    this.disposables.push(mugGeo, mugMat);
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mug.position.set(tableW * 0.38, 0.045, tableD * 0.25);
    this.group.add(mug);
  }

  renderScreen() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    const info = this.scheduler ? this.scheduler.getInfo() : {
      state: 'COUNTDOWN',
      sequenceName: 'Snow Storm Spectacular',
      category: 'Winter Hanabi Sequence',
      timeFormatted: '01:00.0',
      countdownTimer: 60,
      progress: 0.15,
      cueCount: 12
    };

    ctx.clearRect(0, 0, width, height);

    // 1. Terminal Background (Deep Slate Glass)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid scanline texture
    ctx.fillStyle = 'rgba(14, 165, 233, 0.025)';
    for (let y = 0; y < height; y += 8) {
      ctx.fillRect(0, y, width, 2);
    }

    // 2. Top Status Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, 54);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('FDShowStudio Live v3.2', 24, 27);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('ThaoLinn20 • (By FWA Community)', width - 24, 27);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, 54);
    ctx.lineTo(width, 54);
    ctx.stroke();

    // 3. Status Badge & Sequence Name
    let statusColor = '#38bdf8';
    let statusText = 'SCHEDULED GRAND SHOW';

    if (info.giftTriggerInfo) {
      const gifter = info.giftTriggerInfo.userName ? info.giftTriggerInfo.userName.toUpperCase() : 'VIP';
      const gift = info.giftTriggerInfo.giftName ? info.giftTriggerInfo.giftName.toUpperCase() : 'GIFT';
      if (info.state === 'FIRING') {
        statusColor = '#10b981';
        statusText = `LIVE ON AIR • SPONSORED BY ${gifter}`;
      } else {
        statusColor = '#f59e0b';
        statusText = `GIFT SPONSORED BY ${gifter} • ${gift}`;
      }
    } else if (info.state === 'FIRING') {
      statusColor = '#10b981';
      statusText = 'LIVE ON AIR • SHOW EXECUTING';
    } else if (info.countdownTimer <= 10.0 && info.state === 'COUNTDOWN') {
      statusColor = '#ef4444';
      statusText = 'IMMINENT LAUNCH • PREPARING';
    } else if (info.countdownTimer <= 30.0 && info.state === 'COUNTDOWN') {
      statusColor = '#f59e0b';
      statusText = 'LAUNCH WARNING • STANDBY';
    } else if (info.state === 'COOLDOWN') {
      statusColor = '#818cf8';
      statusText = 'SEQUENCE CONCLUDED • COOLDOWN';
    }

    const seqNumStr = `[SEQUENCE ${String((info.currentIndex || 0) + 1).padStart(2, '0')}/${String(info.totalSequences || 1).padStart(2, '0')}] `;
    ctx.fillStyle = statusColor;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${seqNumStr}${statusText}`, 32, 90);

    // Sequence Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 38px system-ui, -apple-system, sans-serif';
    let seqTitle = info.sequenceName || 'Grand Hanabi Sequence';
    if (seqTitle.length > 36) {
      seqTitle = seqTitle.substring(0, 34) + '...';
    }
    ctx.fillText(seqTitle, 32, 134);

    // Category / Metadata tag
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    const sponsorLabel = info.giftTriggerInfo ? ` • SPONSOR: ${info.giftTriggerInfo.userName}` : '';
    ctx.fillText(
      `POWERED BY FDShowStudio • FWA PYROTECHNIC SHOW${sponsorLabel}`,
      32,
      168
    );

    // 4. Centerpiece Huge Digital Countdown Timer Box
    const boxX = 32;
    const boxY = 194;
    const boxW = width - 64;
    const boxH = 148;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 14);
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = statusColor;
    ctx.stroke();

    // Timer Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    let timerLabel = 'TIME REMAINING UNTIL LAUNCH';
    if (info.giftTriggerInfo && info.state === 'COUNTDOWN') {
      timerLabel = 'GIFT SEQUENCE LAUNCH IN - 3s COUNTDOWN';
    } else if (info.state === 'FIRING') {
      timerLabel = info.giftTriggerInfo ? 'SPONSORED SHOW ELAPSED TIME' : 'SEQUENCE ELAPSED TIME';
    } else if (info.state === 'COOLDOWN') {
      timerLabel = 'COOLDOWN TIME';
    }
    ctx.fillText(timerLabel, width * 0.5, boxY + 28);

    // Huge Digital Numbers
    let timerStr = info.timeFormatted || '00:00.0';
    if (info.state === 'COUNTDOWN') {
      timerStr = 'T - ' + timerStr;
    }

    ctx.fillStyle = statusColor;
    ctx.font = '900 72px "Courier New", monospace';
    ctx.shadowColor = statusColor;
    ctx.shadowBlur = 14;
    ctx.fillText(timerStr, width * 0.5, boxY + 92);
    ctx.shadowColor = 'transparent';

    // 5. Progress Bar
    const barX = boxX + 40;
    const barY = boxY + boxH - 20;
    const barW = boxW - 80;
    const barH = 10;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 5);
    ctx.fill();

    const filledW = Math.max(0, Math.min(barW, barW * (info.progress || 0)));
    if (filledW > 0) {
      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, filledW, barH, 5);
      ctx.fill();
    }

    // 6. Creator and Community Signature Panel
    const creditBoxY = 356;
    const creditBoxH = 100;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    ctx.roundRect(boxX, creditBoxY, boxW, creditBoxH, 14);
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Line 1: FDShowStudio Branding
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'FDShowStudio • Hanabi Show System',
      boxX + 24,
      creditBoxY + 30
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      'OFFICIAL SUITE',
      boxX + boxW - 24,
      creditBoxY + 30
    );

    // Subtle divider
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 24, creditBoxY + 54);
    ctx.lineTo(boxX + boxW - 24, creditBoxY + 54);
    ctx.stroke();

    // Line 2: ThaoLinn20 and (By FWA Community)
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 28px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      'DIRECTOR: ThaoLinn20',
      boxX + 24,
      creditBoxY + 76
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 26px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      '(By FWA Community)',
      boxX + boxW - 24,
      creditBoxY + 76
    );

    // 7. Bottom System Status Bar
    const btmY = height - 27;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, height - 54, width, 54);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, height - 54);
    ctx.lineTo(width, height - 54);
    ctx.stroke();

    ctx.fillStyle = info.giftTriggerInfo ? '#f59e0b' : '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    const queueSuffix = info.queueLength > 0 ? ` • QUEUE: ${info.queueLength} PENDING` : '';
    const statusFooter = info.giftTriggerInfo
      ? `STATUS: GIFT TRIGGERED - ${info.giftTriggerInfo.giftName.toUpperCase()}${queueSuffix}`
      : `STATUS: FDShowStudio ACTIVE${queueSuffix}`;
    ctx.fillText(statusFooter, 32, btmY);

    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText('FWA COMMUNITY • THAOLINN20 • [S] FIRE', width - 32, btmY);

    // Update texture and LED
    if (this.screenTexture) {
      this.screenTexture.needsUpdate = true;
    }

    if (this.ledMesh && this.ledMesh.material) {
      this.ledMesh.material.color.set(statusColor);
    }

    if (this.screenLight) {
      this.screenLight.color.set(statusColor);
    }
  }

  update(deltaTime) {
    this.lastRenderTime += deltaTime;
    if (this.lastRenderTime >= this.throttleInterval) {
      this.lastRenderTime = 0;
      this.renderScreen();
    }
  }

  dispose() {
    if (Array.isArray(this.disposables)) {
      for (const item of this.disposables) {
        if (item && typeof item.dispose === 'function') {
          item.dispose();
        }
      }
      this.disposables = [];
    }
    if (this.group && this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}

