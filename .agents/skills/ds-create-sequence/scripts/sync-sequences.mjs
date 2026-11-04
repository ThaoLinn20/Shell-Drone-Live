import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const SEQUENCES_DIR = path.join(ROOT_DIR, 'shell-scripts', 'sequences');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PUBLIC_AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');
const PUBLIC_SEQ_DIR = path.join(PUBLIC_DIR, 'sequences');
const SCHEDULER_FILE = path.join(ROOT_DIR, 'src', 'managers', 'SequenceScheduler.js');

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function toTitleCase(str) {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function toCamelCase(str) {
  return str
    .replace(/[-_]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

export function syncSequences(options = {}) {
  const dryRun = Boolean(options.dryRun);
  const results = {
    audioCopied: [],
    audioSkipped: [],
    sequencesCopied: [],
    sequencesSkipped: [],
    schedulerUpdated: false,
    newlyRegistered: [],
    alreadyRegistered: []
  };

  ensureDirectory(PUBLIC_DIR);
  ensureDirectory(PUBLIC_AUDIO_DIR);
  ensureDirectory(PUBLIC_SEQ_DIR);

  if (!fs.existsSync(SEQUENCES_DIR)) {
    console.warn(`Sequences directory not found: ${SEQUENCES_DIR}`);
    return results;
  }

  const files = fs.readdirSync(SEQUENCES_DIR).filter(f => f.endsWith('.json'));

  // 1. Process each sequence file
  const sequenceMetadata = [];

  for (const filename of files) {
    const filePath = path.join(SEQUENCES_DIR, filename);
    const baseName = path.basename(filename, '.json');
    const seqId = baseName.replace(/[^a-zA-Z0-9_]+/g, '_').toLowerCase();

    let cues = [];
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      cues = JSON.parse(content);
    } catch (err) {
      console.error(`Failed to parse sequence ${filename}:`, err.message);
      continue;
    }

    if (!Array.isArray(cues)) {
      console.warn(`Skipping ${filename}: not an array of cues`);
      continue;
    }

    // Audio cue extraction
    const audioCue = cues.find(c => c && c.type === 'audio');
    const fireworkCues = cues.filter(c => c && c.type !== 'audio');

    let audioFileName = null;
    if (audioCue) {
      audioFileName = audioCue.url || audioCue.name || null;
      if (audioFileName && audioFileName.startsWith('/')) {
        audioFileName = audioFileName.substring(1);
      }
      if (audioFileName && audioFileName.startsWith('audio/')) {
        audioFileName = path.basename(audioFileName);
      }
    }

    // Cue timing analysis
    const times = fireworkCues.map(c => Number(c.time) || 0);
    const minTime = times.length > 0 ? Math.min(...times) : 0;
    const maxTime = times.length > 0 ? Math.max(...times) : 10;
    const duration = Math.ceil(maxTime - minTime + 4.5);

    // Audio file deployment
    if (audioFileName) {
      const srcAudioPath = path.join(SEQUENCES_DIR, audioFileName);
      const targetAudioRoot = path.join(PUBLIC_DIR, audioFileName);
      const targetAudioSub = path.join(PUBLIC_AUDIO_DIR, audioFileName);

      let copied = false;
      if (fs.existsSync(srcAudioPath)) {
        if (!fs.existsSync(targetAudioRoot)) {
          if (!dryRun) fs.copyFileSync(srcAudioPath, targetAudioRoot);
          copied = true;
        }
        if (!fs.existsSync(targetAudioSub)) {
          if (!dryRun) fs.copyFileSync(srcAudioPath, targetAudioSub);
          copied = true;
        }
      }

      if (copied) {
        results.audioCopied.push(audioFileName);
      } else {
        results.audioSkipped.push(audioFileName);
      }
    }

    // Sequence JSON deployment
    const targetSeqPath = path.join(PUBLIC_SEQ_DIR, filename);
    if (!fs.existsSync(targetSeqPath)) {
      if (!dryRun) fs.copyFileSync(filePath, targetSeqPath);
      results.sequencesCopied.push(filename);
    } else {
      results.sequencesSkipped.push(filename);
    }

    // Determine category and human-readable title
    let category = 'Grand Hanabi Sequence';
    if (audioFileName) {
      category = 'Vocal EDM Hanabi Sequence';
    } else if (filename.includes('snow')) {
      category = 'Winter Hanabi Sequence';
    }

    let title = toTitleCase(baseName);
    if (baseName.startsWith('blood-tear-v')) {
      const partNum = baseName.replace('blood-tear-v', '');
      const subtitles = {
        '1': 'Part 1: First Drop',
        '2': 'Part 2: Melodic Bridge',
        '3': 'Part 3: Build-up Surge',
        '4': 'Part 4: Grand Finale Drop'
      };
      title = `Blood Tear - ${subtitles[partNum] || `Part ${partNum}`}`;
    }

    sequenceMetadata.push({
      id: seqId,
      filename,
      importVarName: toCamelCase(baseName),
      title,
      category,
      audioTrack: audioFileName,
      duration,
      cuesCount: fireworkCues.length,
      minTime,
      maxTime
    });
  }

  // 2. Synchronize SequenceScheduler.js registrations
  if (fs.existsSync(SCHEDULER_FILE)) {
    let schedulerCode = fs.readFileSync(SCHEDULER_FILE, 'utf-8');

    for (const meta of sequenceMetadata) {
      const alreadyHasId = schedulerCode.includes(`id: '${meta.id}'`) || schedulerCode.includes(`id: "${meta.id}"`);
      if (alreadyHasId) {
        results.alreadyRegistered.push(meta.id);
      } else {
        results.newlyRegistered.push(meta);
      }
    }

    if (results.newlyRegistered.length > 0 && !dryRun) {
      // Add imports
      const importLines = results.newlyRegistered.map(meta =>
        `import ${meta.importVarName} from '../../shell-scripts/sequences/${meta.filename}';`
      ).join('\n');

      // Insert imports before export const SCHEDULER_STATES
      schedulerCode = importLines + '\n' + schedulerCode;

      // Add entries to DEFAULT_SEQUENCES
      const newEntries = results.newlyRegistered.map(meta => `  {
    id: '${meta.id}',
    title: '${meta.title}',
    category: '${meta.category}',
    audioTrack: ${meta.audioTrack ? `'${meta.audioTrack}'` : 'null'},
    duration: ${meta.duration}.0,
    interval: 60.0,
    cues: ${meta.importVarName}
  }`).join(',\n');

      schedulerCode = schedulerCode.replace(
        /export const DEFAULT_SEQUENCES = \[([\s\S]*?)\];/,
        (match, existingEntries) => {
          const trimmed = existingEntries.trim();
          const separator = trimmed ? ',\n' : '';
          return `export const DEFAULT_SEQUENCES = [\n${trimmed}${separator}${newEntries}\n];`;
        }
      );

      fs.writeFileSync(SCHEDULER_FILE, schedulerCode, 'utf-8');
      results.schedulerUpdated = true;
    }
  }

  return results;
}

// CLI Execution
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  console.log('Running Sequence Sync Pipeline...');
  const res = syncSequences();
  console.log('--- Sync Results ---');
  console.log('Audio Copied:', res.audioCopied.length > 0 ? res.audioCopied : 'None (already present)');
  console.log('Sequences Copied:', res.sequencesCopied.length > 0 ? res.sequencesCopied : 'None (already present)');
  console.log('Already Registered:', res.alreadyRegistered.length, 'sequences');
  console.log('Newly Registered:', res.newlyRegistered.length > 0 ? res.newlyRegistered.map(m => m.id) : 'None (all up-to-date)');
  console.log('Scheduler Code Updated:', res.schedulerUpdated);
  console.log('Sync completed successfully.');
}

