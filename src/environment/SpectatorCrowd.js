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
  0x2563eb, // Royal blue
  0x7c2d12, // Warm terracotta
  0xd97706, // Amber camel
  0x374151, // Graphite gray
  0x1e293b, // Dark obsidian
  0x065f46  // Pine green
];

const FEMALE_CLOTHING_COLORS = [
  0xf43f5e, // Rose pink
  0xa855f7, // Lavender purple
  0xfb7185, // Coral
  0x2dd4bf, // Mint turquoise
  0xf472b6, // Pastel magenta
  0xe11d48, // Ruby
  0xec4899, // Hot pink
  0x06b6d4, // Cyan aqua
  0x8b5cf6, // Violet
  0xfbbf24  // Warm marigold
];

const HAIR_COLORS = [
  0x1a1a24, // Jet black
  0x3d2314, // Chestnut brown
  0x523927, // Dark mocha
  0xb45309, // Amber caramel
  0x78350f, // Warm espresso
  0xe2e8f0  // Ash silver
];

export const SYSTEM_SPEECH_PHRASES = [
  'Pháo hoa đẹp quá!',
  'Tim để bắn pháo!',
  'Welcome!',
  'Thả tim cho pháo hoa đi!',
  'Nhớ Follow nha!',
  'Không đánh nhau!',
  'Đừng chen lấn xô đẩy!',
  'Yêu màu hường ghét màu xám!',
  'Cần bán mèo!',
  'FWA Community!',
  'Tải ngay FDShowStudio nào!',
  'Hello!',
  'Có giao thừa không!',
  'Xin vía!',
  'Oh no!',
  'Trời!',
  'Lạnh quá!',
  'Ai trộm tiền t rồi!',
  'Cháy quá bạn ơi!',
  'Đẹp mê ly luôn!',
  'Bắn tiếp đi!',
  'Góc này view đỉnh chóp!',
  'Team FWA Community điểm danh!',
  'Tuyệt phẩm luôn!',
  'Mãn nhãn thật sự!',
  'Hiệu ứng đỉnh quá!',
  'Cứu tôi, đẹp xỉu!',
  'U là trời!',
  'Bão tim đê anh em!',
  'Chill phết nhờ!',
  '10 điểm không có nhưng!',
  'Tham gia FWA Community nào!',
  'Kiếm người yêu!',
  'FWA Community trên Facebook nhé!',
  'FWA là gì thế? là Firework Art nha!',
  'Cộng đồng pháo hoa nghệ thuật Việt Nam',
  'Này do FWA Community thiết kế à?',
  'Đúng rồi!'
];

export const SYSTEM_SPEECH_AUDIO = {
  'Pháo hoa đẹp quá!': '01-phao-hoa-dep-qua.mp3',
  'Tim để bắn pháo!': '02-tim-de-ban-phao.mp3',
  'Welcome!': '03-welcome.mp3',
  'Thả tim cho pháo hoa đi!': '04-tha-tim-cho-phao-hoa-di.mp3',
  'Nhớ Follow nha!': '05-nho-follow-nha.mp3',
  'Không đánh nhau!': '06-khong-danh-nhau.mp3',
  'Đừng chen lấn xô đẩy!': '07-dung-chen-lan-xo-day.mp3',
  'Yêu màu hường ghét màu xám!': '08-yeu-mau-huong-ghet-mau-xam.mp3',
  'Cần bán mèo!': '09-can-ban-meo.mp3',
  'FWA Community!': null,
  'Tải ngay FDShowStudio nào!': '11-tai-ngay-fdshowstudio-nao.mp3',
  'Hello!': '12-hello.mp3',
  'Có giao thừa không!': '13-co-giao-thua-khong.mp3',
  'Xin vía!': '14-xin-via.mp3',
  'Oh no!': null,
  'Trời!': null,
  'Lạnh quá!': null,
  'Ai trộm tiền t rồi!': null,
  'Cháy quá bạn ơi!': '19-chay-qua-ban-oi.mp3',
  'Đẹp mê ly luôn!': '20-dep-me-ly-luon.mp3',
  'Bắn tiếp đi!': '21-ban-tiep-di.mp3',
  'Góc này view đỉnh chóp!': '22-goc-nay-view-dinh-chop.mp3',
  'Team FWA Community điểm danh!': '23-team-fwa-community-diem-danh.mp3',
  'Tuyệt phẩm luôn!': '24-tuyet-pham-luon.mp3',
  'Mãn nhãn thật sự!': '25-man-nhan-that-su.mp3',
  'Hiệu ứng đỉnh quá!': '26-hieu-ung-dinh-qua.mp3',
  'Cứu tôi, đẹp xỉu!': '27-cuu-toi-dep-xiu.mp3',
  'U là trời!': '28-u-la-troi.mp3',
  'Bão tim đê anh em!': '29-bao-tim-de-anh-em.mp3',
  'Chill phết nhờ!': '30-chill-phet-nho.mp3',
  '10 điểm không có nhưng!': '31-10-diem-khong-co-nhung.mp3',
  'Tham gia FWA Community nào!': '32-tham-gia-fwa-community-nao.mp3',
  'Kiếm người yêu!': '33-kiem-nguoi-yeu.mp3',
  'FWA Community trên Facebook nhé!': '34-fwa-community-tren-facebook-nhe.mp3',
  'FWA là gì thế? là Firework Art nha!': '35-fwa-la-gi-the-la-firework-art-nha.mp3',
  'Cộng đồng pháo hoa nghệ thuật Việt Nam': '36-cong-dong-phao-hoa-nghe-thuat-viet-nam.mp3',
  'Này do FWA Community thiết kế à?': '37-nay-do-fwa-community-thiet-ke-a.mp3',
  'Đúng rồi!': '38-dung-roi.mp3'
};

export class SpectatorCrowd {
  constructor(options = {}) {
    this.group = new THREE.Group();
    this.position = options.position || new THREE.Vector3(0, 0, 415);
    this.characters = [];
    this.viewerMap = new Map();
    this.speechTimer = options.speechTimer || 1.2;
    this.speechInterval = options.speechInterval || 2.8;
    this.enableAutoSpeech = options.enableAutoSpeech !== undefined ? options.enableAutoSpeech : true;
    this.speechAudioEnabled = options.speechAudioEnabled !== undefined ? options.speechAudioEnabled : true;
    this.speechAudioBaseURL = options.speechAudioBaseURL || './audio/speakers/';
    this.speechVolume = options.speechVolume !== undefined ? options.speechVolume : 0.65;
    this.audioPool = new Map();
    this.currentSpeechAudio = null;
    this.pendingReplyTimer = 0;
    this.seatSwapCooldown = 50.0 + Math.random() * 30.0;
    this.multiDepthSlots = [];
    this.slotCount = options.slotCount !== undefined ? options.slotCount : 10;
    this.eventBus = options.eventBus || null;
    this.focusedSpectator = null;
    this.honoraryCharacters = {};
    this.vipTableGroup = null;
    this.eventSubscriptions = [];
    this.disposables = [];

    if (this.eventBus && typeof this.eventBus.on === 'function') {
      this.eventSubscriptions.push(
        this.eventBus.on('camera:third_person_focus', (detail) => {
          this.setThirdPersonFocus(detail?.active ? detail.character : null);
        })
      );
    }

    this.group.position.copy(this.position);
    this.initCrowd();
  }

  setThirdPersonFocus(focusedChar) {
    this.focusedSpectator = focusedChar || null;

    if (!focusedChar) {
      if (this.vipTableGroup) {
        this.vipTableGroup.visible = true;
      }
      for (const char of this.characters) {
        char.group.visible = true;
        if (char.nameTag) {
          char.nameTag.visible = char.isHonorary
            ? true
            : (char.nameTagTimer > 0);
        }
        if (char.speechBubble) {
          char.speechBubble.visible = char.speechTimer > 0;
        }
      }
      return;
    }

    if (this.vipTableGroup) {
      this.vipTableGroup.visible = Boolean(focusedChar.isHonorary);
    }

    for (const char of this.characters) {
      if (char === focusedChar) {
        char.group.visible = true;
        // Hide the billboard name tag and speech bubble during 3rd person POV so they do not occlude fireworks
        if (char.nameTag) {
          char.nameTag.visible = false;
        }
        if (char.speechBubble) {
          char.speechBubble.visible = false;
        }
      } else {
        // Completely hide all other spectators and their tags so the line of sight to fireworks is 100% unobstructed
        char.group.visible = false;
        if (char.nameTag) {
          char.nameTag.visible = false;
        }
        if (char.speechBubble) {
          char.speechBubble.visible = false;
        }
      }
    }
  }

  destroy() {
    if (this.currentSpeechAudio) {
      try {
        this.currentSpeechAudio.pause();
        this.currentSpeechAudio.currentTime = 0;
      } catch (e) {
        // Safe audio pause cleanup
      }
      this.currentSpeechAudio = null;
    }
    this.audioPool.clear();

    for (const unsub of this.eventSubscriptions) {
      unsub();
    }
    this.eventSubscriptions = [];
  }

  initCrowd() {
    const slotCount = this.slotCount;

    // Build the foreground VIP beach picnic lounge (luxury woven rug, floor cushions, low table & drinks)
    this.createVipTableAndLounge();

    // Curated multi-depth spectator slots across the sandy beach (Atami Hanabi style)
    // Row 0: 3 VIP Foreground Honorary Leaders (Seated on luxury beach cushions at front-row picnic)
    // Row 1: Front Shoreline Mats near water edge (Z ~ -13.6)
    // Row 2: Mid-Beach Picnic Clusters (Z ~ -9.2)
    // Row 3: Upper Beach Mats (Z ~ -7.2)
    const multiDepthSlots = [
      // 3 VIP Foreground Honorary Leaders
      // Slot 0: Top Gifter (Center Golden VIP Cushion)
      {
        x: 0.0,
        z: -2.35,
        baseY: 1.20,
        isHonorary: true,
        honoraryType: 'gifter',
        defaultName: 'Anh Tuan VIP',
        initialScore: 1000,
        seated: true,
        holdingPhone: false,
        tagSideOffset: -0.55
      },
      // Slot 1: Top Liker (Left Ruby Heart VIP Cushion)
      {
        x: -1.65,
        z: -2.45,
        baseY: 1.16,
        isHonorary: true,
        honoraryType: 'liker',
        defaultName: 'Linh Dan Top',
        initialScore: 350,
        seated: true,
        holdingPhone: false,
        tagSideOffset: -0.72
      },
      // Slot 2: Top Commenter (Right Cyber Sapphire VIP Cushion)
      {
        x: 1.65,
        z: -2.45,
        baseY: 1.20,
        isHonorary: true,
        honoraryType: 'commenter',
        defaultName: 'Quoc Huy Chat',
        initialScore: 45,
        seated: true,
        holdingPhone: false,
        tagSideOffset: 0.72
      },

      // Audience Spectator Rows (Sitting on coastal picnic sheets & mats like in Atami photo)
      // Row 1: Front Shoreline Mats near water edge
      {
        x: -2.3,
        z: -13.6,
        baseY: 0.08,
        seated: true,
        holdingPhone: true
      },
      {
        x: 2.1,
        z: -13.6,
        baseY: 0.13,
        seated: true,
        holdingPhone: false
      },
      {
        x: -0.2,
        z: -13.4,
        baseY: 0.09,
        seated: true,
        holdingPhone: true
      },

      // Row 2: Mid-Beach Picnic Clusters
      {
        x: -3.3,
        z: -9.2,
        baseY: 0.40,
        seated: true,
        holdingPhone: false
      },
      {
        x: 3.3,
        z: -9.2,
        baseY: 0.55,
        seated: true,
        holdingPhone: false
      },

      // Row 3: Upper Beach Mats
      {
        x: -1.6,
        z: -7.2,
        baseY: 0.72,
        seated: true,
        holdingPhone: false
      },
      {
        x: 1.6,
        z: -7.2,
        baseY: 0.76,
        seated: true,
        holdingPhone: true
      },

      // Extended Reserve Slots (for slotCount > 10)
      {
        x: 0.8,
        z: -13.6,
        baseY: 0.10,
        seated: true,
        holdingPhone: false
      },
      {
        x: -0.6,
        z: -9.2,
        baseY: 0.42,
        seated: true,
        holdingPhone: true
      }
    ];

    const allSlots = multiDepthSlots.slice(0, slotCount);
    while (allSlots.length < slotCount) {
      allSlots.push({
        x: (Math.random() - 0.5) * 5.6,
        z: -13.8 + Math.random() * 8.8,
        holdingPhone: Math.random() < 0.4
      });
    }

    this.multiDepthSlots = allSlots;

    for (let i = 0; i < slotCount; i++) {
      const isFemale = i % 2 === 1;
      const gender = isFemale ? 'female' : 'male';
      const namePool = isFemale ? FEMALE_PARTICIPANTS : MALE_PARTICIPANTS;
      const colorPool = isFemale ? FEMALE_CLOTHING_COLORS : MALE_CLOTHING_COLORS;

      const name = namePool[Math.floor(i * 0.5) % namePool.length];
      const color = colorPool[Math.floor(i * 0.5) % colorPool.length];
      const hairColor = HAIR_COLORS[i % HAIR_COLORS.length];

      const slot = allSlots[i];
      const charName = slot.defaultName || name;
      const x = slot.x + (slot.isHonorary ? 0 : (Math.random() - 0.5) * 0.15);
      const z = slot.z + (slot.isHonorary ? 0 : (Math.random() - 0.5) * 0.15);

      const char = this.createCharacter(
        x,
        z,
        color,
        hairColor,
        charName,
        gender,
        slot,
        i
      );

      // All spectators default to seated posture enjoying the beach fireworks
      this.sitDown(char, true);
      this.characters.push(char);
      this.group.add(char.group);
      this.viewerMap.set(charName.toLowerCase(), i);
    }
  }

  createVipTableAndLounge() {
    const loungeGroup = new THREE.Group();
    loungeGroup.name = 'vipLoungeGroup';
    loungeGroup.position.set(0, 1.20, 0);

    // 1. Luxury Glamping Beach Mat / Woven Boho Rug
    const rugGeo = new THREE.PlaneGeometry(4.4, 2.4);
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e, // Rich warm amber-terracotta woven textile
      roughness: 0.85,
      metalness: 0.05
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI * 0.5;
    rug.position.set(0, 0.015, -2.7);
    loungeGroup.add(rug);

    // Decorative Gold Border Fringe around VIP Rug
    const fringeGeo = new THREE.PlaneGeometry(4.46, 2.46);
    const fringeMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.65
    });
    const fringe = new THREE.Mesh(fringeGeo, fringeMat);
    fringe.rotation.x = -Math.PI * 0.5;
    fringe.position.set(0, 0.01, -2.7);
    loungeGroup.add(fringe);

    // 2. Low Artisanal Beach Picnic Tray Table (Bàn trà bãi biển chân thấp)
    // Tabletop at height 0.32, spans across X = -1.9 to X = +1.9
    const tableTopGeo = new THREE.BoxGeometry(3.8, 0.04, 0.52);
    const tableTopMat = new THREE.MeshStandardMaterial({
      color: 0x3f2e22, // Weathered rich coastal teak wood
      roughness: 0.55,
      metalness: 0.15
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.set(0, 0.30, -3.05);
    loungeGroup.add(tableTop);

    // Gold trim edge on low table
    const trimGeo = new THREE.BoxGeometry(3.84, 0.015, 0.56);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.85,
      roughness: 0.25
    });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, 0.315, -3.05);
    loungeGroup.add(trim);

    // Warm ambient LED underglow beneath low table
    const ledGeo = new THREE.BoxGeometry(3.76, 0.012, 0.02);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const ledStrip = new THREE.Mesh(ledGeo, ledMat);
    ledStrip.position.set(0, 0.28, -2.8);
    loungeGroup.add(ledStrip);

    // Low wooden block feet for picnic tray table
    const footGeo = new THREE.BoxGeometry(0.36, 0.28, 0.44);
    const footMat = new THREE.MeshStandardMaterial({
      color: 0x2e1c12,
      roughness: 0.7
    });
    const footPositionsX = [-1.3, 1.3];
    for (const fx of footPositionsX) {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(fx, 0.14, -3.05);
      loungeGroup.add(foot);
    }

    // Tabletop Centerpiece: Ambient Japanese Festival Candle Lantern
    const lanternBaseGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.03, 16);
    const lanternBaseMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.85,
      roughness: 0.3
    });
    const lanternBase = new THREE.Mesh(lanternBaseGeo, lanternBaseMat);
    lanternBase.position.set(0, 0.335, -3.05);
    loungeGroup.add(lanternBase);

    const candleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.10, 12);
    const candleMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const candle = new THREE.Mesh(candleGeo, candleMat);
    candle.position.set(0, 0.39, -3.05);
    loungeGroup.add(candle);

    // 3 VIP Drink Glasses on Table in front of each seat
    const drinkConfigs = [
      { x: -1.65, color: 0xf43f5e }, // Liker Ruby Cocktail
      { x: 0.0, color: 0xfacc15 },   // Gifter Golden Champagne
      { x: 1.65, color: 0x38bdf8 }   // Commenter Cyan Beverage
    ];

    const glassGeo = new THREE.CylinderGeometry(0.035, 0.025, 0.09, 10);
    for (const d of drinkConfigs) {
      const glassMat = new THREE.MeshStandardMaterial({
        color: d.color,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(d.x, 0.365, -2.95);
      loungeGroup.add(glass);
    }

    // 3. 3 Luxury Beach Floor Cushions (Zafuton / Lounge Cushions)
    const cushionConfigs = [
      { x: -1.65, z: -2.45, rimColor: 0xf43f5e }, // Liker
      { x: 0.0, z: -2.35, rimColor: 0xfde047 },   // Gifter
      { x: 1.65, z: -2.45, rimColor: 0x38bdf8 }   // Commenter
    ];

    const cushionGeo = new THREE.BoxGeometry(0.56, 0.12, 0.52);
    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark charcoal weather-resistant fabric
      roughness: 0.8,
      metalness: 0.1
    });

    const rimGeo = new THREE.TorusGeometry(0.52, 0.016, 8, 24);

    for (const cfg of cushionConfigs) {
      const seatGroup = new THREE.Group();
      seatGroup.position.set(cfg.x, 0, cfg.z);

      // Floor illuminated LED rim on sand
      const rimMat = new THREE.MeshBasicMaterial({ color: cfg.rimColor });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI * 0.5;
      rim.position.set(0, 0.01, 0);
      seatGroup.add(rim);

      // Floor cushion
      const cushion = new THREE.Mesh(cushionGeo, cushionMat);
      cushion.position.set(0, 0.06, 0);
      seatGroup.add(cushion);

      loungeGroup.add(seatGroup);
    }

    this.vipTableGroup = loungeGroup;
    this.group.add(this.vipTableGroup);
  }

  createCharacter(
    x,
    z,
    clothingColor,
    hairColor,
    name,
    gender = 'male',
    slotConfig = {},
    index = 0
  ) {
    const isFemale = gender === 'female';
    const isHonorary = Boolean(slotConfig.isHonorary);
    const honoraryType = slotConfig.honoraryType || null;
    const baseY = Number(slotConfig.baseY) || 0;

    const charGroup = new THREE.Group();
    charGroup.position.set(x, baseY, z);
    charGroup.rotation.y = Math.PI;

    // Subtle scale variation for realistic height and physique differences
    const heightScale = isHonorary
      ? 1.05
      : 0.94 + ((index * 7) % 15) * 0.01;
    const widthScale = isHonorary
      ? 1.04
      : 0.95 + ((index * 5) % 12) * 0.01;
    charGroup.scale.set(widthScale, heightScale, widthScale);

    // 1. Legs, Shoes, and Skirt/Pants
    const legRadius = isFemale ? 0.065 : 0.085;
    const legGeo = new THREE.CylinderGeometry(
      legRadius,
      legRadius + 0.01,
      0.85,
      8
    );
    const legMat = new THREE.MeshStandardMaterial({
      color: isFemale ? 0x0f172a : 0x1e293b,
      roughness: 0.8
    });

    const shoeColors = [0xf8fafc, 0x18181b, 0x78350f, 0x334155];
    const shoeMat = new THREE.MeshStandardMaterial({
      color: shoeColors[index % shoeColors.length],
      roughness: 0.7
    });
    const shoeW = isFemale ? 0.11 : 0.13;
    const shoeH = 0.08;
    const shoeD = isFemale ? 0.20 : 0.24;
    const shoeGeo = new THREE.BoxGeometry(shoeW, shoeH, shoeD);

    const legSpacing = isFemale ? 0.11 : 0.15;
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-legSpacing, 0.85, 0);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(0, -0.42, 0);
    leftLegGroup.add(leftLeg);

    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.83, 0.04);
    leftLegGroup.add(leftShoe);

    charGroup.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(legSpacing, 0.85, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0, -0.42, 0);
    rightLegGroup.add(rightLeg);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.83, 0.04);
    rightLegGroup.add(rightShoe);

    charGroup.add(rightLegGroup);

    // Optional skirt for female characters
    let skirt = null;
    if (isFemale) {
      const skirtGeo = new THREE.CylinderGeometry(
        0.20,
        0.36,
        0.42,
        10
      );
      const skirtMat = new THREE.MeshStandardMaterial({
        color: clothingColor,
        roughness: 0.65
      });
      skirt = new THREE.Mesh(skirtGeo, skirtMat);
      skirt.position.set(0, 0.84, 0);
      charGroup.add(skirt);
    }

    // 2. Torso, Belt, and Collar Detail
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

    // 2b. Stylish Back-of-shirt Jersey / Happi Decal showing username & honorary title
    const shirtPlate = this.createShirtPlateMesh(
      torsoW,
      torsoH,
      torsoD,
      name,
      isHonorary,
      honoraryType,
      index,
      slotConfig.initialScore || 0
    );
    torso.add(shirtPlate);

    // Waist belt with metallic buckle
    const beltGeo = new THREE.BoxGeometry(
      torsoW + 0.02,
      0.06,
      torsoD + 0.02
    );
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8
    });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.86, 0);
    charGroup.add(belt);

    const buckleGeo = new THREE.BoxGeometry(0.08, 0.05, 0.02);
    const buckleMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.75,
      roughness: 0.3
    });
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 0.86, torsoD * 0.5 + 0.015);
    charGroup.add(buckle);

    // Contrasting shirt collar
    const collarGeo = new THREE.BoxGeometry(
      torsoW * 0.45,
      0.05,
      0.08
    );
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.7
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 1.54, torsoD * 0.35);
    charGroup.add(collar);

    // 3. Head, Hair Styles, and Glasses
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.74, 0);

    const headGeo = new THREE.SphereGeometry(
      isFemale ? 0.16 : 0.18,
      12,
      12
    );
    const skinMat = new THREE.MeshStandardMaterial({
      color: isFemale ? 0xffe0bd : 0xffdbac,
      roughness: 0.7
    });
    const head = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(head);

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

    const styleVariant = Math.floor(index * 0.5) % 4;

    if (isFemale) {
      if (styleVariant === 0) {
        // High ponytail with bun
        const longHairGeo = new THREE.CylinderGeometry(
          0.12,
          0.18,
          0.52,
          8
        );
        const longHair = new THREE.Mesh(longHairGeo, hairMat);
        longHair.position.set(0, -0.22, -0.06);
        longHair.rotation.x = -0.1;
        headGroup.add(longHair);

        const bunGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const bun = new THREE.Mesh(bunGeo, hairMat);
        bun.position.set(0, 0.14, -0.16);
        headGroup.add(bun);
      } else if (styleVariant === 1) {
        // Cute twin space buns
        const bunGeo = new THREE.SphereGeometry(0.075, 8, 8);
        const leftBun = new THREE.Mesh(bunGeo, hairMat);
        leftBun.position.set(-0.14, 0.18, -0.05);
        headGroup.add(leftBun);

        const rightBun = new THREE.Mesh(bunGeo, hairMat);
        rightBun.position.set(0.14, 0.18, -0.05);
        headGroup.add(rightBun);
      } else if (styleVariant === 2) {
        // Shoulder-length bob cut
        const bobGeo = new THREE.CylinderGeometry(
          0.14,
          0.20,
          0.38,
          8
        );
        const bob = new THREE.Mesh(bobGeo, hairMat);
        bob.position.set(0, -0.14, -0.05);
        headGroup.add(bob);
      } else {
        // Flowing long locks
        const flowingGeo = new THREE.CylinderGeometry(
          0.14,
          0.22,
          0.62,
          8
        );
        const flowing = new THREE.Mesh(flowingGeo, hairMat);
        flowing.position.set(0, -0.26, -0.06);
        flowing.rotation.x = -0.08;
        headGroup.add(flowing);
      }
    } else {
      if (styleVariant === 0) {
        // Classic front fringe
        const fringeGeo = new THREE.BoxGeometry(0.24, 0.08, 0.14);
        const fringe = new THREE.Mesh(fringeGeo, hairMat);
        fringe.position.set(0, 0.14, 0.10);
        headGroup.add(fringe);
      } else if (styleVariant === 1) {
        // Voluminous quiff
        const quiffGeo = new THREE.BoxGeometry(0.22, 0.14, 0.18);
        const quiff = new THREE.Mesh(quiffGeo, hairMat);
        quiff.position.set(0, 0.16, 0.08);
        quiff.rotation.x = -0.15;
        headGroup.add(quiff);
      } else if (styleVariant === 2) {
        // Side-parted layered hair
        const sideGeo = new THREE.BoxGeometry(0.25, 0.10, 0.16);
        const sidePart = new THREE.Mesh(sideGeo, hairMat);
        sidePart.position.set(-0.04, 0.15, 0.06);
        headGroup.add(sidePart);
      } else {
        // Casual beanie cap
        const beanieMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.9
        });
        const beanieGeo = new THREE.CylinderGeometry(
          0.20,
          0.20,
          0.10,
          10
        );
        const beanie = new THREE.Mesh(beanieGeo, beanieMat);
        beanie.position.set(0, 0.12, 0);
        headGroup.add(beanie);
      }
    }

    // Optional stylish spectacles / glasses
    if (index % 3 === 0) {
      const glassesMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.8,
        roughness: 0.2
      });
      const glassesGeo = new THREE.BoxGeometry(0.26, 0.04, 0.02);
      const glasses = new THREE.Mesh(glassesGeo, glassesMat);
      glasses.position.set(0, 0.02, 0.165);
      headGroup.add(glasses);
    }

    // Golden VIP Crown for Top Gifter
    if (isHonorary && honoraryType === 'gifter') {
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.9,
        roughness: 0.2
      });
      const crownGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.08, 5);
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(0, 0.20, 0);
      headGroup.add(crown);
    }

    headGroup.rotation.x = -0.38 + (Math.random() - 0.5) * 0.10;
    charGroup.add(headGroup);

    // 4. Arms & Smartphone Accessory
    const armRadius = isFemale ? 0.055 : 0.07;
    const armGeo = new THREE.CylinderGeometry(
      armRadius,
      armRadius,
      0.65,
      8
    );
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

    const holdingPhone = Boolean(slotConfig.holdingPhone);
    if (holdingPhone) {
      const phoneGroup = new THREE.Group();
      const phoneBodyMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.4,
        metalness: 0.5
      });
      const phoneBodyGeo = new THREE.BoxGeometry(0.08, 0.15, 0.015);
      const phoneBody = new THREE.Mesh(phoneBodyGeo, phoneBodyMat);
      phoneGroup.add(phoneBody);

      // Glowing camera viewfinder screen facing spectator
      const screenMat = new THREE.MeshBasicMaterial({
        color: 0x67e8f9
      });
      const screenGeo = new THREE.PlaneGeometry(0.07, 0.13);
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 0, -0.009);
      screen.rotation.y = Math.PI;
      phoneGroup.add(screen);

      phoneGroup.position.set(0, -0.58, 0.12);
      phoneGroup.rotation.x = 0.5;
      rightArmGroup.add(phoneGroup);

      // Raise right arm to film fireworks
      rightArmGroup.rotation.set(-1.1, -0.2, -0.3);
    }

    charGroup.add(rightArmGroup);

    // Calculate lateral offset beside the head: left side for left characters, right side for right/center
    const tagSideOffset = slotConfig.tagSideOffset !== undefined
      ? slotConfig.tagSideOffset
      : (x < -0.5 ? -0.72 : 0.72);

    // 5. 3D Name Tag or Prestige Honorary Badge (positioned beside the head at eye level)
    let nameTag = null;
    if (isHonorary) {
      nameTag = this.createHonoraryBadgeSprite(
        name,
        honoraryType,
        slotConfig.initialScore || 0
      );
      nameTag.position.set(tagSideOffset, 1.15, 0);
      nameTag.scale.set(0.95, 0.35, 1.0);
      nameTag.visible = true;
    } else {
      nameTag = this.createNameTagSprite(name, isFemale);
      nameTag.position.set(tagSideOffset, 1.10, 0);
      nameTag.scale.set(0.85, 0.24, 1.0);
      nameTag.visible = false;
    }
    charGroup.add(nameTag);

    // 6. 3D Speech Bubble Sprite
    const speechBubble = this.createSpeechBubbleSprite();
    speechBubble.position.set(0, 3.25, 0);
    speechBubble.scale.set(0.001, 0.001, 0.001);
    charGroup.add(speechBubble);

    const char = {
      group: charGroup,
      gender: gender,
      isHonorary: isHonorary,
      honoraryType: honoraryType,
      honoraryScore: slotConfig.initialScore || 0,
      slotIndex: index,
      tagSideOffset: tagSideOffset,
      holdingPhone: holdingPhone,
      headGroup: headGroup,
      leftArmGroup: leftArmGroup,
      rightArmGroup: rightArmGroup,
      leftLegGroup: leftLegGroup,
      rightLegGroup: rightLegGroup,
      torso: torso,
      skirt: skirt,
      shirtPlate: shirtPlate,
      nameTag: nameTag,
      nameTagTimer: 0,
      speechBubble: speechBubble,
      name: name,
      baseY: baseY,
      baseHeadRotX: headGroup.rotation.x,
      state: 'sitting',
      stateTimer: 999999,
      currentSlotIndex: index,
      cheerTimer: 0,
      speechTimer: 0,
      targetPos: new THREE.Vector3(x, baseY, z),
      walkSpeed: isFemale ? 1.6 : 1.9,
      walkPhase: 0,
      phaseOffset: Math.random() * Math.PI * 2
    };

    if (isHonorary && honoraryType) {
      this.honoraryCharacters[honoraryType] = char;
    }

    return char;
  }

  createShirtPlateMesh(
    torsoW,
    torsoH,
    torsoD,
    name,
    isHonorary = false,
    honoraryType = null,
    slotIndex = 0,
    score = 0
  ) {
    if (typeof document === 'undefined') {
      const dummyGeo = new THREE.PlaneGeometry(0.1, 0.1);
      const dummyMat = new THREE.MeshBasicMaterial({ transparent: true });
      const mesh = new THREE.Mesh(dummyGeo, dummyMat);
      mesh.userData = { canvas: null, ctx: null, texture: null };
      return mesh;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    this.drawShirtPlateCanvas(
      ctx,
      canvas.width,
      canvas.height,
      name,
      isHonorary,
      honoraryType,
      slotIndex,
      score
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    if (this.disposables) {
      this.disposables.push(texture);
    }

    const plateGeo = new THREE.PlaneGeometry(
      torsoW * 0.88,
      torsoH * 0.74
    );
    if (this.disposables) {
      this.disposables.push(plateGeo);
    }

    const plateMat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 0.65,
      metalness: 0.15,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    if (this.disposables) {
      this.disposables.push(plateMat);
    }

    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    // Positioned flush on the back face of the torso facing camera
    plateMesh.position.set(0, 0.03, -torsoD * 0.5 - 0.008);
    plateMesh.rotation.y = Math.PI;

    plateMesh.userData = {
      canvas,
      ctx,
      texture,
      name,
      isHonorary,
      honoraryType,
      slotIndex,
      score
    };

    return plateMesh;
  }

  drawShirtPlateCanvas(
    ctx,
    width,
    height,
    name,
    isHonorary = false,
    honoraryType = null,
    slotIndex = 0,
    score = 0
  ) {
    ctx.clearRect(0, 0, width, height);

    const pad = 14;
    const r = 26;

    let borderColor = '#94a3b8';
    let bannerBg = '#334155';
    let bannerTextColor = '#f8fafc';
    let topTitle = 'HANABI FESTIVAL';
    let bottomSubtitle = '#' + String(slotIndex + 1).padStart(2, '0');
    let emblemColor = '#38bdf8';

    if (isHonorary) {
      if (honoraryType === 'gifter') {
        borderColor = '#f59e0b';
        bannerBg = '#b45309';
        bannerTextColor = '#fffbeb';
        topTitle = 'TOP 1 GIFTER';
        bottomSubtitle = Number(score).toLocaleString() + ' KC';
        emblemColor = '#fbbf24';
      } else if (honoraryType === 'liker') {
        borderColor = '#f43f5e';
        bannerBg = '#be123c';
        bannerTextColor = '#fff1f2';
        topTitle = 'TOP 1 LIKER';
        bottomSubtitle = Number(score).toLocaleString() + ' TIM';
        emblemColor = '#fb7185';
      } else if (honoraryType === 'commenter') {
        borderColor = '#0ea5e9';
        bannerBg = '#0369a1';
        bannerTextColor = '#f0f9ff';
        topTitle = 'TOP 1 CHAT';
        bottomSubtitle = Number(score).toLocaleString() + ' CHAT';
        emblemColor = '#38bdf8';
      }
    }

    ctx.save();

    // 1. Jersey back patch background
    ctx.beginPath();
    ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, r);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();

    // Metallic outer border
    ctx.lineWidth = 8;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Inner glowing rim
    ctx.lineWidth = 2;
    ctx.strokeStyle = isHonorary
      ? 'rgba(255, 255, 255, 0.45)'
      : 'rgba(255, 255, 255, 0.18)';
    ctx.stroke();

    // 2. Top Title Ribbon
    const bannerH = 74;
    ctx.beginPath();
    ctx.roundRect(
      pad + 8,
      pad + 8,
      width - pad * 2 - 16,
      bannerH,
      [r - 6, r - 6, 10, 10]
    );
    ctx.fillStyle = bannerBg;
    ctx.fill();

    ctx.fillStyle = bannerTextColor;
    ctx.font = 'bold 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(topTitle, width * 0.5, pad + 8 + bannerH * 0.5);

    // 3. Center FWA Community Branding
    // Line 1: FWA (Athletic, high-impact block typography)
    const fwaY = 240;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 114px "Arial Black", Impact, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillText('FWA', width * 0.5, fwaY);

    // Decorative metallic divider bar
    const sepW = 190;
    const sepY = 308;
    ctx.beginPath();
    ctx.moveTo((width - sepW) * 0.5, sepY);
    ctx.lineTo((width + sepW) * 0.5, sepY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = emblemColor;
    ctx.stroke();

    // Line 2: Community (Stylized subtitle font)
    const commY = 360;
    ctx.fillStyle = isHonorary ? emblemColor : '#94a3b8';
    ctx.font = 'bold 44px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillText('Community', width * 0.5, commY);
    ctx.shadowColor = 'transparent';

    // 4. Bottom Subtitle / Score / Seat Ribbon
    const bottomH = 68;
    const bottomY = height - pad - 12 - bottomH;
    ctx.beginPath();
    ctx.roundRect(
      pad + 18,
      bottomY,
      width - pad * 2 - 36,
      bottomH,
      16
    );
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    ctx.fillStyle = borderColor;
    ctx.font = 'bold 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bottomSubtitle, width * 0.5, bottomY + bottomH * 0.5);

    ctx.restore();
  }

  updateShirtPlate(char, name, honoraryType = null, score = 0) {
    const plate = char.shirtPlate;
    if (plate && plate.userData && plate.userData.ctx) {
      const { ctx, canvas, texture, slotIndex, isHonorary } = plate.userData;
      this.drawShirtPlateCanvas(
        ctx,
        canvas.width,
        canvas.height,
        name,
        isHonorary,
        honoraryType || char.honoraryType,
        slotIndex,
        score || char.honoraryScore
      );
      texture.needsUpdate = true;
    }
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
      depthTest: true
    });

    const sprite = new THREE.Sprite(spriteMat);
    // Sleek and compact to prevent screen occlusion
    sprite.scale.set(0.95, 0.25, 1.0);
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
      depthTest: true
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.userData = { canvas, ctx, texture };
    return sprite;
  }

  drawNameTagCanvas(ctx, width, height, text, isCelebrating, isFemale = false) {
    ctx.clearRect(0, 0, width, height);

    if (isCelebrating) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.92)';
      ctx.strokeStyle = '#fde047';
    } else if (isFemale) {
      ctx.fillStyle = 'rgba(28, 15, 24, 0.88)';
      ctx.strokeStyle = '#f472b6';
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = '#38bdf8';
    }
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.roundRect(10, 10, width - 20, height - 20, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isCelebrating ? '#000000' : '#ffffff';
    ctx.font = 'bold 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
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

  playSpeechAudio(text) {
    if (!this.speechAudioEnabled || typeof Audio === 'undefined') {
      return;
    }

    const fileName = SYSTEM_SPEECH_AUDIO[text];
    if (!fileName) {
      return;
    }

    try {
      if (this.currentSpeechAudio) {
        this.currentSpeechAudio.pause();
        this.currentSpeechAudio.currentTime = 0;
      }

      let audio = this.audioPool.get(fileName);
      if (!audio) {
        const audioSrc = `${this.speechAudioBaseURL}${fileName}`;
        audio = new Audio(audioSrc);
        this.audioPool.set(fileName, audio);
      }

      audio.volume = this.speechVolume;
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Gracefully suppress browser autoplay restrictions
        });
      }
      this.currentSpeechAudio = audio;
    } catch (err) {
      // Audio playback safety guard
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
    this.playSpeechAudio(text);
  }

  updateNameTag(char, newName, isCelebrating = false) {
    char.name = newName;
    this.updateShirtPlate(
      char,
      newName,
      char.honoraryType,
      char.honoraryScore
    );
    const tag = char.nameTag;
    if (tag && tag.userData.ctx) {
      if (char.isHonorary) {
        this.updateHonoraryBadge(
          char,
          newName,
          char.honoraryType,
          char.honoraryScore
        );
        return;
      }
      const { ctx, canvas, texture, isFemale } = tag.userData;
      this.drawNameTagCanvas(
        ctx,
        canvas.width,
        canvas.height,
        newName,
        isCelebrating,
        isFemale
      );
      texture.needsUpdate = true;
    }
  }

  createHonoraryBadgeSprite(name, type, score = 0) {
    if (typeof document === 'undefined') {
      const dummyMat = new THREE.SpriteMaterial({ transparent: true });
      const sprite = new THREE.Sprite(dummyMat);
      sprite.userData = {
        canvas: null,
        ctx: null,
        texture: null,
        type,
        score
      };
      return sprite;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    this.drawHonoraryBadgeCanvas(
      ctx,
      canvas.width,
      canvas.height,
      name,
      type,
      score
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });

    const sprite = new THREE.Sprite(spriteMat);
    // Well-proportioned VIP badge that stays in foreground without overlapping or blocking fireworks
    sprite.scale.set(1.15, 0.40, 1.0);
    sprite.userData = {
      canvas,
      ctx,
      texture,
      type,
      score
    };
    return sprite;
  }

  drawHonoraryBadgeCanvas(ctx, width, height, name, type, score = 0) {
    ctx.clearRect(0, 0, width, height);

    let bgStyle = 'rgba(26, 20, 10, 0.94)';
    let borderColor = '#fbbf24';
    let glowColor = 'rgba(251, 191, 36, 0.65)';
    let titleBg = '#f59e0b';
    let titleText = 'TOP 1 GIFTER';
    let nameColor = '#fef08a';
    let scoreText = `${Number(score).toLocaleString()} KC`;
    let scoreColor = '#fbbf24';

    if (type === 'liker') {
      bgStyle = 'rgba(32, 10, 18, 0.94)';
      borderColor = '#f43f5e';
      glowColor = 'rgba(244, 63, 94, 0.65)';
      titleBg = '#f43f5e';
      titleText = 'TOP 1 LIKER';
      nameColor = '#ffe4e6';
      scoreText = `${Number(score).toLocaleString()} TIM`;
      scoreColor = '#fb7185';
    } else if (type === 'commenter') {
      bgStyle = 'rgba(8, 22, 38, 0.94)';
      borderColor = '#38bdf8';
      glowColor = 'rgba(56, 189, 248, 0.65)';
      titleBg = '#0284c7';
      titleText = 'TOP 1 CHAT';
      nameColor = '#e0f2fe';
      scoreText = `${Number(score).toLocaleString()} BINH LUAN`;
      scoreColor = '#38bdf8';
    }

    // 1. Outer glowing prestige frame with rounded corners
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.fillStyle = bgStyle;
    ctx.beginPath();
    ctx.roundRect(10, 10, width - 20, height - 20, 24);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. Inner fine ornamental border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(16, 16, width - 32, height - 32, 18);
    ctx.stroke();

    // 3. Top Title Ribbon Banner
    const ribbonW = 200;
    const ribbonH = 30;
    const ribbonX = (width - ribbonW) * 0.5;
    const ribbonY = 12;
    ctx.fillStyle = titleBg;
    ctx.beginPath();
    ctx.roundRect(ribbonX, ribbonY, ribbonW, ribbonH, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, width * 0.5, ribbonY + ribbonH * 0.5);

    // 4. Middle User Name
    ctx.fillStyle = nameColor;
    ctx.font = 'bold 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let displayName = name;
    if (displayName.length > 20) {
      displayName = displayName.substring(0, 18) + '...';
    }
    ctx.fillText(displayName, width * 0.5, 84);

    // 5. Bottom Score Pill
    const pillW = 220;
    const pillH = 32;
    const pillX = (width - pillW) * 0.5;
    const pillY = 126;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 19px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scoreText, width * 0.5, pillY + pillH * 0.5);
  }

  updateHonoraryLeader(category, user, score) {
    const char = this.honoraryCharacters[category];
    if (!char) {
      return;
    }

    const cleanName = user?.nickname || user?.name || char.name;
    char.name = cleanName;
    char.honoraryScore = score;

    this.updateHonoraryBadge(
      char,
      cleanName,
      category,
      score
    );

    char.state = 'cheering';
    char.cheerTimer = 4.0;
    this.standUp(char);

    this.viewerMap.set(cleanName.toLowerCase(), char.slotIndex);
  }

  updateHonoraryBadge(char, name, type, score) {
    this.updateShirtPlate(char, name, type, score);
    const badge = char.nameTag;
    if (badge && badge.userData.ctx) {
      const { ctx, canvas, texture } = badge.userData;
      this.drawHonoraryBadgeCanvas(
        ctx,
        canvas.width,
        canvas.height,
        name,
        type,
        score
      );
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
      const femaleKeywords = [
        'linh',
        'mai',
        'phuong',
        'tien',
        'chau',
        'anh',
        'ha',
        'nhi',
        'yen',
        'trang',
        'nga',
        'thao',
        'lan'
      ];
      const wantsFemale = femaleKeywords.some((w) => key.includes(w));
      const isGift = Boolean(data.giftName || data.diamondCount);

      // Find matching gender slot if available
      let matchingIndices = this.characters
        .map((c, idx) => ({ c, idx }))
        .filter((item) => (wantsFemale ? item.c.gender === 'female' : item.c.gender === 'male'));

      if (matchingIndices.length === 0) {
        matchingIndices = this.characters.map((c, idx) => ({ c, idx }));
      }

      if (isGift) {
        // Prioritize front railing slots (most negative Z) for gifters to guarantee an unblocked VIP view
        matchingIndices.sort((a, b) => a.c.group.position.z - b.c.group.position.z);
        charIndex = matchingIndices[0].idx;
      } else {
        charIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)].idx;
      }
      this.viewerMap.set(key, charIndex);
    }

    const char = this.characters[charIndex];
    if (char) {
      char.state = 'cheering';
      char.cheerTimer = 3.5;
      if (!char.isHonorary) {
        char.nameTagTimer = 6.0;
        if (char.nameTag) {
          char.nameTag.visible = true;
        }
      }
      this.standUp(char);
      this.updateNameTag(char, cleanName, true);
      this.updateShirtPlate(
        char,
        cleanName,
        char.isHonorary ? char.honoraryType : null,
        data.diamondCount || 0
      );

      if (data.comment) {
        this.showSpeech(char, data.comment, 6.0, cleanName);
      } else if (data.giftName) {
        this.showSpeech(char, 'Tặng ' + data.giftName + '!', 4.5, cleanName);
      }

      // If action is a gift, notify camera to focus in third-person view behind this spectator
      const isGift = Boolean(data.giftName || data.diamondCount);
      if (isGift && this.eventBus && typeof this.eventBus.emit === 'function') {
        const coins = Number(data.diamondCount || data.diamonds || 1);
        const cameraHoldDuration = coins >= 5 ? 25.0 : 15.0;
        this.eventBus.emit('spectator:focus_third_person', {
          character: char,
          user,
          data,
          duration: cameraHoldDuration
        });
      }
    }

    return char;
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
    char.headGroup.rotation.x = char.baseHeadRotX;
    char.leftArmGroup.position.y = 1.48;
    char.rightArmGroup.position.y = 1.48;
    char.leftArmGroup.rotation.set(0, 0, 0);

    if (char.holdingPhone) {
      char.rightArmGroup.rotation.set(-1.1, -0.2, -0.3);
    } else {
      char.rightArmGroup.rotation.set(0, 0, 0);
    }

    const sideX = char.tagSideOffset !== undefined ? char.tagSideOffset : 0.72;
    char.nameTag.position.set(sideX, char.isHonorary ? 1.72 : 1.68, 0);
    char.nameTag.scale.set(char.isHonorary ? 0.95 : 0.85, char.isHonorary ? 0.35 : 0.24, 1.0);
    char.speechBubble.position.set(0, 3.25, 0);
    char.group.position.y = char.baseY;
  }

  sitDown(char, force = false) {
    if (char.isHonorary && !force) {
      return;
    }
    const isFemale = char.gender === 'female';
    const legSpacing = isFemale ? 0.11 : 0.15;
    char.state = 'sitting';
    char.stateTimer = 999999;

    const sideX = char.tagSideOffset !== undefined ? char.tagSideOffset : 0.72;

    if (char.isHonorary) {
      // Seated on luxury VIP beach floor cushion at front-row picnic
      char.leftLegGroup.rotation.x = -Math.PI * 0.48;
      char.rightLegGroup.rotation.x = -Math.PI * 0.48;
      char.leftLegGroup.position.set(-legSpacing, 0.18, 0.10);
      char.rightLegGroup.position.set(legSpacing, 0.18, 0.10);

      char.torso.position.y = 0.62;
      if (char.skirt) {
        char.skirt.position.y = 0.40;
      }
      char.headGroup.position.y = 1.18;
      char.headGroup.rotation.x = -0.42; // Gazing up towards fireworks over the sea
      char.leftArmGroup.position.y = 0.88;
      char.rightArmGroup.position.y = 0.88;
      // Resting arms naturally forward towards the low picnic tray table
      char.leftArmGroup.rotation.set(-0.35, 0.10, 0);
      char.rightArmGroup.rotation.set(-0.35, -0.10, 0);

      // Name badge positioned beside the head at eye level (leaving sky 100% clear)
      char.nameTag.position.set(sideX, 1.15, 0);
      char.nameTag.scale.set(0.95, 0.35, 1.0);
      char.speechBubble.position.set(0, 2.30, 0);
    } else {
      // Seated casually on coastal Hanabi leisure sheets & sand mats
      char.leftLegGroup.rotation.x = -Math.PI * 0.48;
      char.rightLegGroup.rotation.x = -Math.PI * 0.48;
      char.leftLegGroup.position.set(-legSpacing, 0.16, 0.08);
      char.rightLegGroup.position.set(legSpacing, 0.16, 0.08);

      char.torso.position.y = 0.54;
      if (char.skirt) {
        char.skirt.position.y = 0.34;
      }
      char.headGroup.position.y = 1.10;
      char.headGroup.rotation.x = -0.46; // Gazing up towards sky and fireworks
      char.leftArmGroup.position.y = 0.82;
      char.rightArmGroup.position.y = 0.82;
      char.leftArmGroup.rotation.set(-0.25, 0, 0);

      if (char.holdingPhone) {
        char.rightArmGroup.rotation.set(-0.95, -0.15, -0.2);
      } else {
        char.rightArmGroup.rotation.set(-0.25, 0, 0);
      }

      // Name badge positioned beside the head at eye level
      char.nameTag.position.set(sideX, 1.10, 0);
      char.nameTag.scale.set(0.85, 0.24, 1.0);
      char.speechBubble.position.set(0, 2.20, 0);
    }
  }

  pickRandomWalkTarget(char, force = false) {
    if (char.isHonorary && !force) {
      return;
    }
    const targetX = (Math.random() - 0.5) * 6.0;
    const targetZ = -13.8 + Math.random() * 9.0;
    char.targetPos.set(targetX, char.baseY || 0.1, targetZ);
    this.standUp(char);
    char.state = 'walking';
    char.stateTimer = 15.0;
  }

  triggerRandomSeatSwap() {
    // Only 1 person moves at a time to preserve the calm, atmospheric beach aesthetic
    if (this.characters.some((c) => c.state === 'walking')) {
      return;
    }

    // Eligible candidates: seated non-honorary spectators not currently cheering
    const eligibleChars = this.characters.filter(
      (c) => !c.isHonorary && c.state === 'sitting' && c.cheerTimer <= 0
    );
    if (eligibleChars.length === 0) return;

    const char = eligibleChars[Math.floor(Math.random() * eligibleChars.length)];

    // Target slots: audience slots (index >= 3)
    const candidateSlots = [];
    for (let i = 3; i < this.multiDepthSlots.length; i++) {
      if (i !== char.currentSlotIndex) {
        candidateSlots.push({ index: i, slot: this.multiDepthSlots[i] });
      }
    }
    if (candidateSlots.length === 0) return;

    const chosen = candidateSlots[Math.floor(Math.random() * candidateSlots.length)];
    const targetSlot = chosen.slot;

    this.standUp(char);
    char.state = 'walking';
    char.stateTimer = 25.0;
    char.targetSlotIndex = chosen.index;
    char.baseY = targetSlot.baseY !== undefined ? targetSlot.baseY : 0.1;
    char.targetPos.set(targetSlot.x, char.baseY, targetSlot.z);
  }

  update(deltaTime) {
    const time = Date.now() * 0.0025;

    // Periodic natural festival speech bubbles from random spectators
    if (this.enableAutoSpeech) {
      this.speechTimer -= deltaTime;
      if (this.speechTimer <= 0) {
        this.speechTimer = this.speechInterval + Math.random() * 2.5;
        const availableSpeakers = this.characters.filter((c) => c.speechTimer <= 0);
        if (availableSpeakers.length > 0) {
          const speaker = availableSpeakers[Math.floor(Math.random() * availableSpeakers.length)];
          const phrase = SYSTEM_SPEECH_PHRASES[Math.floor(Math.random() * SYSTEM_SPEECH_PHRASES.length)];
          this.showSpeech(speaker, phrase, 3.6);

          // 40% chance another spectator chimes in with a natural reaction shortly after
          if (Math.random() < 0.40 && availableSpeakers.length > 1) {
            this.pendingReplyTimer = 0.9 + Math.random() * 0.8;
          }
        }
      }

      // Conversational response from fellow spectator
      if (this.pendingReplyTimer > 0) {
        this.pendingReplyTimer -= deltaTime;
        if (this.pendingReplyTimer <= 0) {
          const availableSpeakers = this.characters.filter((c) => c.speechTimer <= 0);
          if (availableSpeakers.length > 0) {
            const replier = availableSpeakers[Math.floor(Math.random() * availableSpeakers.length)];
            const replyPhrase = SYSTEM_SPEECH_PHRASES[Math.floor(Math.random() * SYSTEM_SPEECH_PHRASES.length)];
            this.showSpeech(replier, replyPhrase, 3.2);
          }
        }
      }
    }

    // Occasional, gentle seat swapping between picnic mats
    this.seatSwapCooldown -= deltaTime;
    if (this.seatSwapCooldown <= 0) {
      this.seatSwapCooldown = 50.0 + Math.random() * 30.0;
      this.triggerRandomSeatSwap();
    }

    for (const char of this.characters) {
      if (!char.isHonorary && char.nameTagTimer > 0) {
        char.nameTagTimer -= deltaTime;
        if (char.nameTagTimer <= 0 && char.nameTag) {
          char.nameTag.visible = false;
        }
      }

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
          this.sitDown(char, true);
          this.updateNameTag(char, char.name, false);
          char.leftArmGroup.rotation.z = 0;
          if (char.holdingPhone) {
            char.rightArmGroup.rotation.set(-0.95, -0.15, -0.2);
          } else {
            char.rightArmGroup.rotation.z = 0;
          }
          char.group.position.y = char.baseY;
          char.headGroup.rotation.x = char.baseHeadRotX;
        }
        continue;
      }

      char.stateTimer -= deltaTime;
      if (char.stateTimer <= 0) {
        if (char.state === 'walking') {
          // If walking timed out, sit down at current spot
          this.sitDown(char, true);
        } else if (char.state === 'watching') {
          this.sitDown(char, true);
        } else {
          char.stateTimer = 999999;
        }
      }

      if (char.state === 'walking') {
        const currentPos = char.group.position;
        const dx = char.targetPos.x - currentPos.x;
        const dz = char.targetPos.z - currentPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.35) {
          char.group.rotation.y = Math.atan2(dx, dz);

          const step = Math.min(char.walkSpeed * deltaTime, dist);
          currentPos.x = THREE.MathUtils.clamp(
            currentPos.x + (dx / dist) * step,
            -6.0,
            6.0
          );
          currentPos.z = THREE.MathUtils.clamp(
            currentPos.z + (dz / dist) * step,
            -15.0,
            -2.0
          );

          char.walkPhase += deltaTime * 6.5;
          char.leftLegGroup.rotation.x = Math.sin(char.walkPhase) * 0.55;
          char.rightLegGroup.rotation.x = -Math.sin(char.walkPhase) * 0.55;
          char.group.position.y = char.baseY + Math.abs(Math.sin(char.walkPhase)) * 0.08;

          char.leftArmGroup.rotation.x = -Math.sin(char.walkPhase) * 0.45;
          if (char.holdingPhone) {
            char.rightArmGroup.rotation.x = -1.0 + Math.sin(char.walkPhase) * 0.15;
          } else {
            char.rightArmGroup.rotation.x = Math.sin(char.walkPhase) * 0.45;
          }
        } else {
          currentPos.x = char.targetPos.x;
          currentPos.z = char.targetPos.z;
          char.group.rotation.y = Math.PI;
          if (char.targetSlotIndex !== undefined) {
            char.currentSlotIndex = char.targetSlotIndex;
          }
          this.sitDown(char, true);
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
        if (char.holdingPhone) {
          char.rightArmGroup.rotation.x = -1.1 + Math.sin(time * 0.4 + char.phaseOffset) * 0.03;
          char.rightArmGroup.rotation.z = -0.3 + Math.sin(time * 0.5 + char.phaseOffset) * 0.02;
        } else {
          char.rightArmGroup.rotation.z = -Math.sin(time * 0.5 + char.phaseOffset) * 0.04;
        }
      }
    }
  }

  dispose() {
    if (this.currentSpeechAudio) {
      try {
        this.currentSpeechAudio.pause();
        this.currentSpeechAudio.currentTime = 0;
      } catch (e) {
        // Safe audio pause cleanup
      }
      this.currentSpeechAudio = null;
    }
    this.audioPool.clear();

    if (Array.isArray(this.disposables)) {
      for (const item of this.disposables) {
        if (item && typeof item.dispose === 'function') {
          item.dispose();
        }
      }
      this.disposables = [];
    }
    if (Array.isArray(this.eventSubscriptions)) {
      for (const sub of this.eventSubscriptions) {
        if (typeof sub === 'function') {
          sub();
        }
      }
      this.eventSubscriptions = [];
    }
  }
}
