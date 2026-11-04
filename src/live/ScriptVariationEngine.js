// Script Variation Engine
// Intermediate middleware that indexes pre-designed shell scripts,
// applies cross-tier probabilistic routing, dynamic quantity calculation,
// altitude clamping, spatial jitter, and curated color variations.

import { proceduralShellGenerator } from '../factories/ProceduralShellGenerator.js';

// Eagerly load all JSON script templates from shell-scripts folder
const rawScriptFiles = import.meta.glob('../../shell-scripts/**/*.json', {
  eager: true,
  import: 'default'
});

export const CURATED_COLOR_PALETTES = [
  '#f43f5e',
  '#fda4af',
  '#fbbf24',
  '#fef08a',
  '#38bdf8',
  '#7dd3fc',
  '#34d399',
  '#a7f3d0',
  '#c084fc',
  '#e9d5ff',
  '#fb923c',
  '#fdba74',
  '#e11d48',
  '#00e5ff',
  '#00e676',
  '#ffd700',
  '#d500f9',
  '#ffffff'
];

export const HARMONIC_PALETTES = [
  {
    primary: '#ff2d55',
    secondary: '#ffd700',
    name: 'crimson_gold'
  },
  {
    primary: '#00e5ff',
    secondary: '#ffffff',
    name: 'electric_diamond'
  },
  {
    primary: '#d500f9',
    secondary: '#38bdf8',
    name: 'amethyst_cyan'
  },
  {
    primary: '#00e676',
    secondary: '#fbbf24',
    name: 'emerald_amber'
  },
  {
    primary: '#fb923c',
    secondary: '#ff2d55',
    name: 'tangerine_ruby'
  },
  {
    primary: '#38bdf8',
    secondary: '#e9d5ff',
    name: 'sapphire_lavender'
  },
  {
    primary: '#ffd700',
    secondary: '#00e5ff',
    name: 'gold_cyan'
  },
  {
    primary: '#ff4081',
    secondary: '#ffffff',
    name: 'sakura_white'
  },
  {
    primary: '#a855f7',
    secondary: '#34d399',
    name: 'violet_mint'
  },
  {
    primary: '#ef4444',
    secondary: '#38bdf8',
    name: 'fire_ice'
  }
];

export const ALTITUDE_BOUNDS = {
  heart: {
    min: 0.38,
    max: 0.55
  },
  small_shell: {
    min: 0.48,
    max: 0.70
  },
  big_shell: {
    min: 0.70,
    max: 0.92
  },
  sequence: {
    min: 0.45,
    max: 0.85
  }
};

export const PROBABILITY_MATRIX = {
  like: {
    single: {
      big_shell: 0.50,
      heart: 0.45,
      sequence: 0.05
    },
    combo: {
      big_shell: 0.55,
      heart: 0.35,
      sequence: 0.10
    }
  },
  comment: {
    single: {
      small_shell: 0.75,
      heart: 0.15,
      big_shell: 0.08,
      sequence: 0.02
    }
  },
  gift: {
    single: {
      big_shell: 0.70,
      heart: 0.15,
      sequence: 0.15
    }
  }
};

export class ScriptVariationEngine {
  constructor(options = {}) {
    this.fireworkSystem = options.fireworkSystem || null;
    this.fireworkSequencer = options.fireworkSequencer || null;
    this.cometSystem = options.cometSystem || null;

    this.curatedColors = options.curatedColors || CURATED_COLOR_PALETTES;
    this.harmonicPalettes = options.harmonicPalettes || HARMONIC_PALETTES;
    this.altitudeBounds = options.altitudeBounds || ALTITUDE_BOUNDS;
    this.probabilityMatrix = options.probabilityMatrix || PROBABILITY_MATRIX;

    // Build and freeze catalog templates to guarantee immutability
    const sourceFiles = options.scripts || rawScriptFiles;
    this.catalog = this.buildCatalog(sourceFiles);
    this.deepFreeze(this.catalog);

    // Track last picked index per category to avoid immediate repetition
    this.lastPickedIndex = new Map();

    // Diagnostics counters
    this.diagnostics = {
      totalExecuted: 0,
      byCategory: {
        heart: 0,
        small_shell: 0,
        big_shell: 0,
        sequence: 0
      }
    };
  }

  buildCatalog(rawFiles) {
    const catalog = {
      heart: [],
      small_shell: [],
      big_shell: [],
      sequence: []
    };

    for (const [pathKey, content] of Object.entries(rawFiles)) {
      if (!content) continue;
      const normalizedPath = pathKey.replace(/\\/g, '/').toLowerCase();

      let targetCategory = null;
      if (normalizedPath.includes('/heart/')) {
        targetCategory = 'heart';
      } else if (normalizedPath.includes('/small-shell/')) {
        targetCategory = 'small_shell';
      } else if (normalizedPath.includes('/big-shell/')) {
        targetCategory = 'big_shell';
      } else if (normalizedPath.includes('/sequences/')) {
        targetCategory = 'sequence';
      }

      if (targetCategory) {
        const items = Array.isArray(content) ? content : [content];
        catalog[targetCategory].push(items);
      }
    }

    return catalog;
  }

  deepFreeze(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    Object.freeze(obj);
    for (const key of Object.getOwnPropertyNames(obj)) {
      const val = obj[key];
      if (val && typeof val === 'object' && !Object.isFrozen(val)) {
        this.deepFreeze(val);
      }
    }
    return obj;
  }

  cloneTemplate(items) {
    return JSON.parse(JSON.stringify(items));
  }

  rollVariant(eventType = 'like', tier = 'single') {
    const eventConfig = this.probabilityMatrix[eventType] || this.probabilityMatrix.like;
    const weights = eventConfig[tier] || eventConfig.single || { heart: 1.0 };

    const rand = Math.random();
    let cumulative = 0;

    for (const [category, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        if (this.catalog[category] && this.catalog[category].length > 0) {
          return category;
        }
      }
    }

    // Default category fallback
    if (eventType === 'gift') return 'big_shell';
    if (eventType === 'comment') return 'small_shell';
    return 'heart';
  }

  resolveShotCount(category, eventType, comboCount = 1) {
    // Big shells are strictly limited to 3-4 shots
    if (category === 'big_shell') {
      return Math.floor(Math.random() * 2 + 3);
    }
    // Sequences fire exactly 1 time
    if (category === 'sequence') {
      return 1;
    }
    if (eventType === 'gift') {
      const base = comboCount >= 5 ? 10 : 6;
      const spread = comboCount >= 5 ? 9 : 5;
      return Math.floor(Math.random() * spread + base);
    }
    if (eventType === 'comment' || eventType === 'chat') {
      return Math.floor(Math.random() * 4 + 3);
    }
    // 'like'
    if (comboCount > 3) {
      return Math.floor(Math.random() * 7 + 6);
    }
    return Math.floor(Math.random() * 4 + 3);
  }

  resolveAltitude(category) {
    const bounds = this.altitudeBounds[category] || this.altitudeBounds.small_shell;
    const jitter = (Math.random() - 0.5) * 0.06;
    const rawRatio = bounds.min + Math.random() * (bounds.max - bounds.min) + jitter;
    return Math.max(0.24, Math.min(0.95, rawRatio));
  }

  pickTemplate(category) {
    const list = this.catalog[category] || [];
    if (list.length === 0) return null;
    if (list.length === 1) return list[0];

    const lastIndex = this.lastPickedIndex.get(category);
    let chosenIndex = Math.floor(Math.random() * list.length);
    if (chosenIndex === lastIndex) {
      chosenIndex = (chosenIndex + 1) % list.length;
    }
    this.lastPickedIndex.set(category, chosenIndex);
    return list[chosenIndex];
  }

  splitIntoSalvos(totalShots, category) {
    if (category === 'sequence') {
      return [1];
    }
    if (category === 'big_shell') {
      return [Math.min(4, Math.max(3, totalShots))];
    }
    if (totalShots <= 4) {
      return [Math.max(1, totalShots)];
    }
    if (totalShots === 5) {
      return [3, 2];
    }

    // Mathematical partition into strictly 3s and 4s
    let count4 = 0;
    let count3 = 0;

    if (totalShots % 4 === 0) {
      count4 = totalShots / 4;
    } else if (totalShots % 3 === 0) {
      count3 = totalShots / 3;
    } else if (totalShots % 3 === 1) {
      count4 = 1;
      count3 = (totalShots - 4) / 3;
    } else {
      // totalShots % 3 === 2
      count4 = 2;
      count3 = (totalShots - 8) / 3;
    }

    const salvos = [];
    for (let i = 0; i < count4; i++) salvos.push(4);
    for (let i = 0; i < count3; i++) salvos.push(3);

    return salvos.sort(() => 0.5 - Math.random());
  }

  mutateTemplate(items, category, eventType, comboCount) {
    const rawCloned = this.cloneTemplate(items);
    const baseTemplateItems = (
      category === 'sequence' &&
      Array.isArray(rawCloned) &&
      rawCloned.length > 0
    )
      ? [rawCloned[Math.floor(Math.random() * rawCloned.length)]]
      : rawCloned;

    const totalShots = this.resolveShotCount(category, eventType, comboCount);
    const salvos = this.splitIntoSalvos(totalShots, category);
    const targetAltitude = this.resolveAltitude(category);

    const waves = [];

    for (let w = 0; w < salvos.length; w++) {
      const salvoCount = salvos[w];
      const waveItems = this.cloneTemplate(baseTemplateItems);

      for (const item of waveItems) {
        // 1. Altitude adaptation
        item.ratioY = targetAltitude;
        if (item.y1 !== undefined) {
          item.y1 = Math.max(0.2, targetAltitude - 0.08);
        }
        if (item.y2 !== undefined) {
          item.y2 = Math.min(0.95, targetAltitude + 0.08);
        }

        // 2. Count adjustment: each salvo is strictly capped at 3-4 shells
        item.count = salvoCount;

        // 3. Spatial Jitter framed strictly within camera field of view
        item.sectorId = 'center';
        if (category === 'heart') {
          const heartJitter = (Math.random() - 0.5) * 0.28;
          item.ratioX = Math.max(0.32, Math.min(0.68, 0.50 + heartJitter));
          if (item.x1 !== undefined && item.x2 !== undefined) {
            item.x1 = Math.max(0.25, Math.min(0.75, item.x1 + heartJitter));
            item.x2 = Math.max(0.25, Math.min(0.75, item.x2 + heartJitter));
          }
        } else {
          const centerJitter = (Math.random() - 0.5) * 0.32;
          if (item.x1 !== undefined && item.x2 !== undefined) {
            item.x1 = Math.max(0.18, Math.min(0.82, item.x1 + centerJitter));
            item.x2 = Math.max(0.18, Math.min(0.82, item.x2 + centerJitter));
          } else {
            item.ratioX = Math.max(0.22, Math.min(0.78, 0.50 + centerJitter));
          }
        }
        if (item.angle !== undefined) {
          item.angle = Math.max(-0.25, Math.min(0.25, item.angle));
        }

        // 4. Color Variation & Shell Layer Harmonization
        this.applyColorVariation(item, category);

        // 5. Dynamic Pyrotechnic Effects & Modifiers (Effects, Size, Lifetime, Dynamics)
        this.applyDynamicsAndEffectsVariation(item, category);

        // 6. Wave tracking index for staggered salvo playback
        item._waveIndex = w;

        // 7. Duration Staggering
        if (item.duration !== undefined) {
          item.duration = Math.max(
            0.1,
            Math.min(2.5, item.duration + (Math.random() - 0.5) * 0.1)
          );
        }

        waves.push(item);
      }
    }

    return waves;
  }

  applyColorVariation(item, category) {
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const chosenPalette = pickRandom(this.harmonicPalettes);

    if (category === 'heart' || item.shapeType === 'heart') {
      item.shapeType = 'heart';
      item.preset = 'heart';
      item.shapeRenderMode = 'outline';
      if (
        !item.dynamicsType ||
        item.dynamicsType === 'crysanthemum-spiral' ||
        item.dynamicsType === 'crysanthemum-spiral-v2'
      ) {
        item.dynamicsType = 'standard';
      }
      const heartColors = [
        '#ff2d55',
        '#ff375f',
        '#ff6482',
        '#ff4081',
        '#f43f5e',
        '#fda4af',
        '#ffd700',
        '#ffffff',
        '#e9d5ff',
        '#fb7185'
      ];
      item.color = pickRandom(heartColors);
      if (item.pistilColor || item.pistil) {
        item.pistilColor = Math.random() < 0.5 ? '#ffffff' : '#ffd700';
      }
      return;
    }

    // Dynamic primary and secondary color assignment
    item.color = chosenPalette.primary;
    if (item.color2 !== undefined || Math.random() < 0.40) {
      item.color2 = chosenPalette.secondary;
    }

    if (item.pistil || item.pistilColor) {
      item.pistilColor = chosenPalette.secondary;
    }

    // Mutate multi-nested concentric stages in big shells
    if (Array.isArray(item.stages) && item.stages.length > 0) {
      const shuffledColors = [...this.curatedColors].sort(() => {
        return 0.5 - Math.random();
      });
      for (let s = 0; s < item.stages.length; s++) {
        const stage = item.stages[s];
        stage.color = shuffledColors[s % shuffledColors.length];
      }
    }

    // Mutate second-burst child shells in big and small shells
    if (item.secondBurst && Array.isArray(item.secondBurst.childShells)) {
      for (const child of item.secondBurst.childShells) {
        child.color = Math.random() < 0.5
          ? chosenPalette.secondary
          : pickRandom(this.curatedColors);
      }
    }
  }

  applyDynamicsAndEffectsVariation(item, category) {
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // 1. Dynamic Lifetime factor
    let lifeFactor = 1.0;
    if (category === 'small_shell') {
      lifeFactor = 0.85 + Math.random() * 1.15;
    } else if (category === 'big_shell') {
      lifeFactor = 1.20 + Math.random() * 1.20;
    } else if (category === 'heart') {
      lifeFactor = 0.90 + Math.random() * 0.70;
    } else {
      lifeFactor = 0.90 + Math.random() * 0.60;
    }
    item.starLifeMultiplier = Math.round(lifeFactor * 100) / 100;
    if (item.starLifeMultiplier > 1.6) {
      item['long-burn'] = true;
      item.longBurn = true;
    }

    // 2. Coupled Shell Size
    // Rule: "tăng thời gian sống thì tăng ít kích cỡ"
    const baseLife = category === 'big_shell' ? 1.4 : 1.0;
    const lifeExcess = Math.max(0, lifeFactor - baseLife);
    const sizeFromLife = lifeExcess * 0.20; // Slight increase when life is extended
    const sizeJitter = (Math.random() - 0.5) * 0.20;

    let baseSize = 1.05;
    if (category === 'small_shell') {
      baseSize = 1.05;
      item.shellSize = Math.max(
        0.85,
        Math.min(1.35, baseSize + sizeFromLife + sizeJitter)
      );
    } else if (category === 'big_shell') {
      baseSize = 1.65;
      item.shellSize = Math.max(
        1.40,
        Math.min(2.15, baseSize + sizeFromLife + sizeJitter)
      );
    } else if (category === 'heart') {
      baseSize = 1.25;
      item.shellSize = Math.max(
        1.10,
        Math.min(1.55, baseSize + sizeFromLife + sizeJitter)
      );
    } else {
      baseSize = 1.05;
      item.shellSize = Math.max(
        0.90,
        Math.min(1.40, baseSize + sizeFromLife + sizeJitter)
      );
    }
    item.shellSize = Math.round(item.shellSize * 100) / 100;

    // 3. Coupled Particle Spawn Rate Multiplier
    // Rule: "tăng kích cỡ thì nên giảm tỉ lệ sinh hạt"
    // Rule: "tăng thời gian sống thì giảm tỉ lệ sinh hạt"
    const sizeExcess = Math.max(0, item.shellSize - baseSize);
    const particleReduction = (sizeExcess * 0.65) + (lifeExcess * 0.35);
    const particleBonus = (
      item.shellSize < baseSize
        ? (baseSize - item.shellSize) * 0.40
        : 0
    ) + (
      lifeFactor < baseLife
        ? (baseLife - lifeFactor) * 0.25
        : 0
    );

    const calculatedParticles = 1.05 - particleReduction + particleBonus + (
      Math.random() - 0.5
    ) * 0.08;
    item.particleCountMultiplier = Math.round(
      Math.max(0.60, Math.min(1.30, calculatedParticles)) * 100
    ) / 100;

    // 4. Dynamic Launch Comet Trail
    const cometTrails = [
      'normal',
      'thick',
      'thin',
      'detached',
      'smoke'
    ];
    item.cometTrail = pickRandom(cometTrails);

    // 5. Active Optical Visual Effects Pool
    const poolOfActiveEffects = [
      'strobe',
      'glitter-strobe',
      'white-strobe',
      'crackle',
      'ghost',
      'crossette',
      'tadpole-flurry',
      'burst-smoke',
      'apex-hang',
      'erratic-dart',
      'diamond-scintillation'
    ];

    if (!Array.isArray(item.effects)) {
      item.effects = [];
    }

    // For small shells and general bursts: assign 1 to 2 random active optical effects
    if (category === 'small_shell' || Math.random() < 0.65) {
      const effectCount = Math.random() < 0.35 ? 2 : 1;
      const shuffled = [...poolOfActiveEffects].sort(() => {
        return 0.5 - Math.random();
      });
      const selected = shuffled.slice(0, effectCount);

      for (const eff of selected) {
        if (!item.effects.includes(eff)) {
          item.effects.push(eff);
        }
        item[eff] = true;
        if (eff === 'glitter-strobe') item.glitterStrobe = true;
        if (eff === 'white-strobe') item.whiteStrobe = true;
        if (eff === 'burst-smoke') item.burstSmoke = true;
        if (eff === 'apex-hang') item.apexHang = true;
        if (eff === 'tadpole-flurry') item.tadpoleFlurry = true;
        if (eff === 'erratic-dart') item.erraticDart = true;
      }
    }

    // 6. Dynamic Shapes and Kinematic Dynamics for small shells
    if (category === 'small_shell') {
      const allowedSmallShapes = [
        'sphere',
        'ring',
        'flower',
        'sparking',
        'star'
      ];
      if (!item.shapeType || item.shapeType === 'sphere' || Math.random() < 0.45) {
        item.shapeType = pickRandom(allowedSmallShapes);
      }

      const allowedSmallDynamics = [
        'crysanthemum-trail',
        'flow',
        'standard',
        'willow',
        'droop',
        'falling-leaves',
        'sparking',
        'crossette'
      ];
      if (Math.random() < 0.70) {
        item.dynamicsType = pickRandom(allowedSmallDynamics);
      }

      // 35% chance to add pistil core
      if (Math.random() < 0.35) {
        item.pistil = true;
        if (!item.pistilColor) {
          item.pistilColor = Math.random() < 0.5 ? '#ffffff' : '#ffd700';
        }
      }
    }
  }

  execute(eventType = 'like', eventData = {}, options = {}) {
    const comboCount = eventData?.data?.comboCount || eventData?.data?.repeatCount || 1;
    const tier = comboCount >= 5 ? 'combo' : 'single';

    const category = this.rollVariant(eventType, tier);
    const rawTemplate = this.pickTemplate(category);

    this.diagnostics.totalExecuted += 1;
    if (this.diagnostics.byCategory[category] !== undefined) {
      this.diagnostics.byCategory[category] += 1;
    }

    if (!rawTemplate) {
      this.fallbackProcedural(eventType, eventData);
      return;
    }

    const mutatedItems = this.mutateTemplate(
      rawTemplate,
      category,
      eventType,
      comboCount
    );

    this.dispatchMutatedSequence(mutatedItems, category);
  }

  dispatchMutatedSequence(items, category) {
    if (!Array.isArray(items)) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const waveIndex = item._waveIndex !== undefined ? item._waveIndex : i;
      const delayMs = waveIndex * Math.floor(Math.random() * 250 + 800);

      setTimeout(() => {
        if (this.fireworkSequencer) {
          const pattern = item.pattern || 'random';
          this.fireworkSequencer.playPattern(pattern, item);
        } else if (this.fireworkSystem) {
          this.fireworkSystem.launchRandom(item.preset || item, {
            ratioX: item.ratioX !== undefined ? item.ratioX : (item.x1 || 0.5),
            ratioY: item.ratioY !== undefined ? item.ratioY : 0.6
          });
        }
      }, delayMs);
    }
  }

  fallbackProcedural(eventType, eventData) {
    if (!this.fireworkSystem) return;

    const shell = proceduralShellGenerator.generate({
      tier: eventType === 'gift' ? 'medium' : 'mini',
      shape: eventType === 'like' ? 'heart' : 'sphere',
      shapeRenderMode: eventType === 'like' ? 'outline' : 'standard',
      dynamics: 'standard'
    });

    this.fireworkSystem.launchRandom(shell, {
      sectorId: 'center',
      ratioX: 0.50 + (Math.random() - 0.5) * 0.3,
      ratioY: eventType === 'gift' ? 0.75 : 0.45
    });
  }
}

