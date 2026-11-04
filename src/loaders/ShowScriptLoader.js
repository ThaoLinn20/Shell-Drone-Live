// Show Script Loader
// Safely scans, validates, and loads firework show scripts and custom presets

export class ShowScriptLoader {
  constructor(options = {}) {
    this.showsBaseUrl = options.showsBaseUrl || './shows/';
    this.showRegistry = new Map();
  }

  // Validates a raw JSON payload against firework sequence schema
  validate(rawJson) {
    if (!rawJson) {
      return { valid: false, errors: ['JSON is empty or null'], normalizedCues: [] };
    }

    const errors = [];
    let items = [];

    if (Array.isArray(rawJson)) {
      items = rawJson;
    } else if (typeof rawJson === 'object') {
      if (Array.isArray(rawJson.sequences)) {
        items = rawJson.sequences;
      } else if (Array.isArray(rawJson.events)) {
        items = rawJson.events;
      } else if (Array.isArray(rawJson.tracks)) {
        // Flatten cues from tracks
        items = [];
        for (const track of rawJson.tracks) {
          if (Array.isArray(track.cues)) {
            items.push(...track.cues);
          } else if (Array.isArray(track.items)) {
            items.push(...track.items);
          }
        }
      } else {
        errors.push('Unrecognized show schema structure: missing sequences, events or tracks array');
      }
    } else {
      errors.push('Show script must be an array or object');
    }

    if (errors.length > 0) {
      return { valid: false, errors, normalizedCues: [] };
    }

    // Validate and sanitize individual cues
    const normalizedCues = [];
    for (let i = 0; i < items.length; i++) {
      const cue = items[i];
      if (!cue || typeof cue !== 'object') {
        continue;
      }

      const rawTime = cue.time !== undefined ? cue.time : cue.timestamp;
      const parsedTime = Number(rawTime);
      const time = Number.isFinite(parsedTime) && parsedTime >= 0 ? parsedTime : 0;

      const sanitizedCue = {
        time: time,
        type: cue.type || 'sequence',
        pattern: cue.pattern || 'random',
        preset: cue.preset || 'sphere',
        shapeType: cue.shapeType || cue.shape || 'sphere',
        dynamicsType: cue.dynamicsType || cue.effect || 'standard',
        count: Math.min(Math.max(Number(cue.count) || 100, 10), 1500),
        duration: Math.min(Math.max(Number(cue.duration) || 200, 50), 3000),
        sectorId: cue.sectorId || 'center',
        pistil: Boolean(cue.pistil),
        instantBurst: Boolean(cue.instantBurst),
        effects: Array.isArray(cue.effects) ? [...cue.effects] : [],
        cometTrail: cue.cometTrail || 'normal'
      };

      normalizedCues.push(sanitizedCue);
    }

    // Sort cues by time ascending
    normalizedCues.sort((a, b) => a.time - b.time);

    return {
      valid: normalizedCues.length > 0,
      errors: normalizedCues.length === 0 ? ['No valid cues found in show script'] : [],
      normalizedCues: normalizedCues
    };
  }

  // Load a show file from public/shows directory
  async loadFromUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' while fetching ' + url);
      }
      const json = await response.json();
      const validation = this.validate(json);
      if (!validation.valid) {
        console.warn('[ShowScriptLoader] Validation warnings for ' + url + ':', validation.errors);
      }
      return validation.normalizedCues;
    } catch (err) {
      console.error('[ShowScriptLoader] Failed to load show from ' + url + ':', err.message);
      return [];
    }
  }

  // Register a show in memory
  registerShow(name, cues) {
    const validation = this.validate(cues);
    if (validation.valid) {
      this.showRegistry.set(name, validation.normalizedCues);
      console.log('[ShowScriptLoader] Registered show "' + name + '" (' + validation.normalizedCues.length + ' cues)');
      return true;
    }
    return false;
  }

  getShow(name) {
    return this.showRegistry.get(name) || null;
  }

  listShows() {
    return Array.from(this.showRegistry.keys());
  }
}

export const showScriptLoader = new ShowScriptLoader();
