import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LiveHUDOverlay } from '../../src/ui/LiveHUDOverlay.js';

describe('LiveHUDOverlay', () => {
  let hud;

  function createMockElement(tag) {
    const el = {
      tagName: tag.toUpperCase(),
      style: {},
      children: [],
      innerText: '',
      title: '',
      value: '',
      type: '',
      placeholder: '',
      parentNode: null,
      appendChild: vi.fn((child) => {
        el.children.push(child);
        child.parentNode = el;
        return child;
      }),
      removeChild: vi.fn((child) => {
        const idx = el.children.indexOf(child);
        if (idx !== -1) el.children.splice(idx, 1);
        child.parentNode = null;
        return child;
      }),
      addEventListener: vi.fn()
    };
    return el;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    const mockBody = createMockElement('body');

    vi.stubGlobal('document', {
      createElement: vi.fn((tag) => createMockElement(tag)),
      body: mockBody
    });

    vi.stubGlobal('requestAnimationFrame', (cb) => cb());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should initialize LiveHUDOverlay with chat stream container', () => {
    hud = new LiveHUDOverlay();
    expect(hud.container).toBeDefined();
    expect(hud.chatContainer).toBeDefined();
    expect(hud.activeChatMessages.length).toBe(0);
  });

  it('should display incoming chat message with prominent styling and fade timer', () => {
    hud = new LiveHUDOverlay();

    hud.notifyChat({
      user: { nickname: 'ThaoLinh', name: 'thaolinn20' },
      data: { comment: 'Phao hoa dep qua!' }
    });

    expect(hud.activeChatMessages.length).toBe(1);
    const msg = hud.activeChatMessages[0];
    expect(msg.element.children.length).toBe(2);

    const nameEl = msg.element.children[0].children[0];
    const commentEl = msg.element.children[1];
    expect(nameEl.innerText).toBe('ThaoLinh');
    expect(commentEl.innerText).toBe('Phao hoa dep qua!');
    expect(commentEl.style.fontSize).toBe('18px');
    expect(commentEl.style.fontWeight).toBe('600');

    // Fast forward 8 seconds to trigger fade
    vi.advanceTimersByTime(8100);
    expect(msg.element.style.opacity).toBe('0');
  });

  it('should cap active chat messages to keep the screen uncluttered', () => {
    hud = new LiveHUDOverlay();

    for (let i = 0; i < 6; i++) {
      hud.notifyChat({
        user: { nickname: `User_${i}` },
        data: { comment: `Test message ${i}` }
      });
    }

    // Maximum 4 messages kept active simultaneously
    expect(hud.activeChatMessages.length).toBeLessThanOrEqual(4);
  });
});
