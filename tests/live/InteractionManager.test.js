import { describe, it, expect, vi } from 'vitest';
import { InteractionManager } from '../../src/live/InteractionManager.js';

describe('InteractionManager', () => {
  const customRules = [
    {
      id: 'rule_rose',
      name: 'Rose Rule',
      condition: { type: 'gift', giftName: 'Rose' },
      action: { mode: 'procedural', tier: 'mini' },
      priority: 1,
      rateLimitMs: 50
    },
    {
      id: 'rule_big_gift',
      name: 'Big Gift Rule',
      condition: { type: 'gift', minDiamonds: 1000 },
      action: { mode: 'volley', count: 3, tier: 'grand' },
      priority: 8
    },
    {
      id: 'rule_chat_heart',
      name: 'Chat Heart',
      condition: { type: 'chat', regex: '^!(tim|heart)$' },
      action: { mode: 'procedural', tier: 'mini', shape: 'heart' },
      priority: 2
    }
  ];

  it('should match gift by name and enqueue action', () => {
    const manager = new InteractionManager({ rules: customRules });
    const event = {
      type: 'gift',
      user: { name: 'viewer1' },
      data: { giftName: 'Rose', diamondCount: 1 }
    };

    manager.handleIncomingEvent(event);
    expect(manager.queue.length).toBe(1);
    expect(manager.queue[0].rule.id).toBe('rule_rose');
    expect(manager.queue[0].priority).toBe(1);
  });

  it('should match gift by diamond threshold and prioritize higher diamond gift', () => {
    const manager = new InteractionManager({ rules: customRules });
    
    // Add small gift first
    manager.handleIncomingEvent({
      type: 'gift',
      data: { giftName: 'Rose', diamondCount: 1 }
    });

    // Add big gift second
    manager.handleIncomingEvent({
      type: 'gift',
      data: { giftName: 'Dragon', diamondCount: 2000 }
    });

    expect(manager.queue.length).toBe(2);
    // Highest priority should be first in queue
    expect(manager.queue[0].rule.id).toBe('rule_big_gift');
    expect(manager.queue[1].rule.id).toBe('rule_rose');
  });

  it('should match chat command with regex', () => {
    const manager = new InteractionManager({ rules: customRules });
    manager.handleIncomingEvent({
      type: 'chat',
      data: { comment: '!tim' }
    });

    expect(manager.queue.length).toBe(1);
    expect(manager.queue[0].rule.id).toBe('rule_chat_heart');
  });

  it('should ignore non-matching chat comment', () => {
    const manager = new InteractionManager({ rules: customRules });
    manager.handleIncomingEvent({
      type: 'chat',
      data: { comment: 'Hello streamer' }
    });

    expect(manager.queue.length).toBe(0);
  });

  it('should notify HUD on gift and chat events', () => {
    const mockHud = {
      notifyGift: vi.fn(),
      notifyChat: vi.fn()
    };
    const manager = new InteractionManager({ rules: customRules, hud: mockHud });

    const giftEvent = { type: 'gift', data: { giftName: 'Rose' } };
    manager.handleIncomingEvent(giftEvent);
    expect(mockHud.notifyGift).toHaveBeenCalledWith(giftEvent);

    const chatEvent = { type: 'chat', data: { comment: '!tim' } };
    manager.handleIncomingEvent(chatEvent);
    expect(mockHud.notifyChat).toHaveBeenCalledWith(chatEvent);
  });

  it('should support dynamic rule updates', () => {
    const manager = new InteractionManager({ rules: customRules });
    expect(manager.rules).toHaveLength(3);

    manager.updateRules([{ id: 'new_rule', condition: { type: 'gift' } }]);
    expect(manager.rules).toHaveLength(1);
    expect(manager.rules[0].id).toBe('new_rule');
  });
});

