import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import {
  TEXT_GLYPHS,
  sanitizeText,
  splitCommentIntoWords,
  layoutWord
} from '../../src/factories/TextGlyphAtlas.js';
import { BurstShapeGenerator } from '../../src/factories/BurstShapeGenerator.js';
import { ShellPresetFactory } from '../../src/factories/ShellPresetFactory.js';
import { InteractionManager } from '../../src/live/InteractionManager.js';

describe('Text Firework System', () => {
  describe('TextGlyphAtlas', () => {
    it('should have all 26 letters A-Z and 10 digits 0-9 in atlas', () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const digits = '0123456789'.split('');

      for (const char of letters) {
        const glyph = TEXT_GLYPHS[char];
        expect(glyph).toBeDefined();
        expect(glyph.width).toBeGreaterThanOrEqual(1);
        expect(glyph.height).toBeGreaterThanOrEqual(1);
        expect(glyph.points.length).toBeGreaterThan(0);
      }

      for (const digit of digits) {
        const glyph = TEXT_GLYPHS[digit];
        expect(glyph).toBeDefined();
        expect(glyph.width).toBeGreaterThanOrEqual(1);
        expect(glyph.height).toBeGreaterThanOrEqual(1);
        expect(glyph.points.length).toBeGreaterThan(0);
      }
    });

    it('should sanitize Vietnamese diacritics and special characters correctly', () => {
      expect(sanitizeText('chào các bạn 2026')).toBe('CHAO CAC BAN 2026');
      expect(sanitizeText('Đồng Khởi Việt Nam')).toBe('DONG KHOI VIET NAM');
      expect(sanitizeText('hello!!! @#$% moi nguoi')).toBe('HELLO MOI NGUOI');
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null)).toBe('');
    });

    it('should split comment into words and respect limits', () => {
      const words = splitCommentIntoWords('hello moi nguoi');
      expect(words).toEqual(['HELLO', 'MOI', 'NGUOI']);

      const limitedWords = splitCommentIntoWords('mot hai ba bon nam sau', 3);
      expect(limitedWords).toHaveLength(3);
      expect(limitedWords).toEqual(['MOT', 'HAI', 'BA']);

      const longWords = splitCommentIntoWords('sieuquadaithaoduoc', 4, 6);
      expect(longWords[0]).toHaveLength(6);
      expect(longWords[0]).toBe('SIEUQU');
    });

    it('should layout words into centered 3D Vector3 points', () => {
      const points = layoutWord('HELLO', { scale: 0.38 });
      expect(points.length).toBeGreaterThan(50);

      // Verify points are instances of THREE.Vector3
      expect(points[0]).toBeInstanceOf(THREE.Vector3);

      // Verify X center of mass is balanced around 0
      const sumX = points.reduce((acc, p) => acc + p.x, 0);
      const avgX = sumX / points.length;
      expect(Math.abs(avgX)).toBeLessThan(1.0);
    });
  });

  describe('BurstShapeGenerator Text Integration', () => {
    it('should resolve text_word shape correctly', () => {
      expect(BurstShapeGenerator.resolveShape('text_word')).toBe('text_word');
      expect(BurstShapeGenerator.resolveShape('text-word')).toBe('text_word');
      expect(BurstShapeGenerator.resolveShape('text')).toBe('text_word');
    });

    it('should generate direction vectors for text_word shape with tilt angle', () => {
      const dir0 = BurstShapeGenerator.direction(
        'text_word',
        0,
        0,
        70,
        { textWord: 'TEST' }
      );
      expect(dir0).toBeInstanceOf(THREE.Vector3);
      expect(dir0.lengthSq()).toBeGreaterThan(0);

      const dir1 = BurstShapeGenerator.direction(
        'text_word',
        0,
        5,
        70,
        { textWord: 'TEST' }
      );
      expect(dir1).toBeInstanceOf(THREE.Vector3);
    });
  });

  describe('ShellPresetFactory Text Integration', () => {
    it('should include text_word in shapeRegistry and presets', () => {
      const factory = new ShellPresetFactory();
      expect(factory.shapeRegistry.has('text_word')).toBe(true);

      const preset = factory.createPresetByKey('text_word');
      expect(preset).toBeDefined();
      expect(preset.shapeType).toBe('text_word');
      expect(preset.shellType).toBe('text_word');
      expect(preset.textWord).toBe('HELLO');
    });

    it('should create customized textWordShell with specific word and color', () => {
      const factory = new ShellPresetFactory();
      const preset = factory.textWordShell('CHAO', {
        color: 0x38bdf8,
        size: 2
      });

      expect(preset.textWord).toBe('CHAO');
      expect(preset.color).toBe(0x38bdf8);
      expect(preset.textPoints.length).toBeGreaterThan(0);
      expect(preset.drag).toBeCloseTo(1.85);
    });
  });

  describe('InteractionManager Text Firework Trigger', () => {
    it('should launch 3 separate staggered word fireworks for a 3-word comment', () => {
      vi.useFakeTimers();

      const launchedShells = [];
      const mockFireworkSystem = {
        launchRandom: vi.fn((shellPreset, options) => {
          launchedShells.push({ shellPreset, options });
        })
      };

      const manager = new InteractionManager({
        fireworkSystem: mockFireworkSystem
      });

      // User comments: "hello moi nguoi"
      manager.handleIncomingEvent({
        type: 'chat',
        user: { name: 'viewer99', nickname: 'Viewer 99' },
        data: { comment: 'hello moi nguoi' }
      });

      // Immediate: word 0 launched
      expect(mockFireworkSystem.launchRandom).toHaveBeenCalledTimes(1);
      expect(launchedShells[0].shellPreset.textWord).toBe('HELLO');
      expect(launchedShells[0].options.ratioX).toBeLessThan(0.50);

      // Advance timer by 1200ms -> word 1 launched
      vi.advanceTimersByTime(1200);
      expect(mockFireworkSystem.launchRandom).toHaveBeenCalledTimes(2);
      expect(launchedShells[1].shellPreset.textWord).toBe('MOI');
      expect(launchedShells[1].options.ratioX).toBeCloseTo(0.50, 1);

      // Advance timer by 1200ms -> word 2 launched
      vi.advanceTimersByTime(1200);
      expect(mockFireworkSystem.launchRandom).toHaveBeenCalledTimes(3);
      expect(launchedShells[2].shellPreset.textWord).toBe('NGUOI');
      expect(launchedShells[2].options.ratioX).toBeGreaterThan(0.50);

      vi.useRealTimers();
    });
  });
});

