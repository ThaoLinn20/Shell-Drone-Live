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
  '#ffffff'
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
      heart: 0.92,
      small_shell: 0.06,
      big_shell: 0.02
    },
    combo: {
      heart: 0.85,
      small_shell: 0.10,
      big_shell: 0.05
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
    if (eventType === 'gift') {
      const base = comboCount >= 5 ? 4 : 2;
      return Math.floor(Math.random() * 3 + base);
    }
    if (eventType === 'comment') {
      return Math.floor(Math.random() * 2 + 1);
    }
    // 'like'
    if (comboCount > 3) {
      return Math.floor(Math.random() * 3 + 2);
    }
    return Math.floor(Math.random() * 2 + 1);
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

  mutateTemplate(items, category, eventType, comboCount) {
    const cloned = this.cloneTemplate(items);
    const targetAltitude = this.resolveAltitude(category);
    const shotCount = this.resolveShotCount(category, eventType, comboCount);

    for (const item of cloned) {
      // 1. Altitude adaptation
      item.ratioY = targetAltitude;
      if (item.y1 !== undefined) {
        item.y1 = Math.max(0.2, targetAltitude - 0.08);
      }
      if (item.y2 !== undefined) {
        item.y2 = Math.min(0.95, targetAltitude + 0.08);
      }

      // 2. Count adjustment
      if (item.count !== undefined) {
        if (category === 'sequence') {
          item.count = Math.max(2, Math.min(item.count, 6));
        } else {
          item.count = shotCount;
        }
      }

      // 3. Spatial Jitter across river
      const centerJitter = (Math.random() - 0.5) * 0.36;
      if (item.x1 !== undefined && item.x2 !== undefined) {
        item.x1 = Math.max(0.08, Math.min(0.92, item.x1 + centerJitter));
        item.x2 = Math.max(0.08, Math.min(0.92, item.x2 + centerJitter + (Math.random() - 0.5) * 0.12));
      } else {
        item.ratioX = Math.max(0.12, Math.min(0.88, 0.50 + centerJitter));
      }

      // 4. Color Variation & Heart Outline Safeguards
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
          '#ffffff'
        ];
        if (!item.color || Math.random() < 0.40) {
          item.color = heartColors[
            Math.floor(Math.random() * heartColors.length)
          ];
        }
      } else if (!item.color || Math.random() < 0.40) {
        item.color = this.curatedColors[
          Math.floor(Math.random() * this.curatedColors.length)
        ];
      }

      // 5. Duration Staggering
      if (item.duration !== undefined) {
        item.duration = Math.max(
          0.1,
          Math.min(2.5, item.duration + (Math.random() - 0.5) * 0.1)
        );
      }
    }

    return cloned;
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
      const delayMs = i * Math.floor(Math.random() * 80 + 100);

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

