// Live HUD Overlay Component
// Implements 9:16 Mobile Safe Zones, gift celebration banners, and interactive test controls

export class LiveHUDOverlay {
  constructor(options = {}) {
    this.container = null;
    this.bannerContainer = null;
    this.statusPill = null;
    this.testToolbar = null;
    this.interactionManager = options.interactionManager || null;
    this.visible = true;
    this.activeBanners = [];

    this.initDOM();
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'live-hud-overlay';
    this.container.style.position = 'fixed';
    this.container.style.inset = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '9999';
    this.container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.container.style.userSelect = 'none';

    // Gift Celebration Banner container (positioned in lower safe zone above chat)
    this.bannerContainer = document.createElement('div');
    this.bannerContainer.style.position = 'absolute';
    this.bannerContainer.style.left = '24px';
    this.bannerContainer.style.bottom = '36%';
    this.bannerContainer.style.display = 'flex';
    this.bannerContainer.style.flexDirection = 'column';
    this.bannerContainer.style.gap = '8px';
    this.bannerContainer.style.maxWidth = '360px';
    this.container.appendChild(this.bannerContainer);

    // Live status pill (top right corner)
    this.statusPill = document.createElement('div');
    this.statusPill.style.position = 'absolute';
    this.statusPill.style.top = '16px';
    this.statusPill.style.right = '16px';
    this.statusPill.style.padding = '6px 14px';
    this.statusPill.style.borderRadius = '20px';
    this.statusPill.style.background = 'rgba(15, 23, 42, 0.75)';
    this.statusPill.style.backdropFilter = 'blur(8px)';
    this.statusPill.style.border = '1px solid rgba(255, 255, 255, 0.15)';
    this.statusPill.style.color = '#94a3b8';
    this.statusPill.style.fontSize = '12px';
    this.statusPill.style.fontWeight = '500';
    this.statusPill.style.display = 'flex';
    this.statusPill.style.alignItems = 'center';
    this.statusPill.style.gap = '8px';
    this.statusPill.style.pointerEvents = 'auto';
    this.statusPill.style.cursor = 'pointer';
    this.statusPill.title = 'Click to toggle Quick Test Controls';
    this.statusPill.innerText = 'TikTok Live: Disconnected';
    this.statusPill.addEventListener('click', () => this.toggleTestToolbar());
    this.container.appendChild(this.statusPill);

    // Quick Test Toolbar for streamer (bottom center, hidden by default, toggled via Hotkey or Pill)
    this.createTestToolbar();

    document.body.appendChild(this.container);

    // Bind interaction manager status if available
    if (this.interactionManager) {
      this.interactionManager.on('status', (status) => this.updateStatus(status));
    }
  }

  createTestToolbar() {
    this.testToolbar = document.createElement('div');
    this.testToolbar.style.position = 'absolute';
    this.testToolbar.style.bottom = '16px';
    this.testToolbar.style.left = '50%';
    this.testToolbar.style.transform = 'translateX(-50%)';
    this.testToolbar.style.display = 'none';
    this.testToolbar.style.flexWrap = 'wrap';
    this.testToolbar.style.justifyContent = 'center';
    this.testToolbar.style.gap = '8px';
    this.testToolbar.style.padding = '10px 16px';
    this.testToolbar.style.background = 'rgba(15, 23, 42, 0.90)';
    this.testToolbar.style.backdropFilter = 'blur(12px)';
    this.testToolbar.style.borderRadius = '12px';
    this.testToolbar.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    this.testToolbar.style.pointerEvents = 'auto';
    this.testToolbar.style.maxWidth = '90vw';

    const testButtons = [
      { label: 'Rose (1)', action: () => this.simulateGift('Rose', 5655, 1) },
      { label: 'Heart (5)', action: () => this.simulateGift('Finger Heart', 5882, 5) },
      { label: 'Confetti (100)', action: () => this.simulateGift('Confetti', 6064, 100) },
      { label: 'Fireworks (1088)', action: () => this.simulateGift('Fireworks', 6104, 1088) },
      { label: 'Universe (34999)', action: () => this.simulateGift('TikTok Universe', 6268, 34999) },
      { label: 'Chat !tim', action: () => this.simulateChat('!tim') },
      { label: 'Chat !phaohoa', action: () => this.simulateChat('!phaohoa') }
    ];

    for (const btn of testButtons) {
      const el = document.createElement('button');
      el.innerText = btn.label;
      el.style.padding = '6px 12px';
      el.style.fontSize = '12px';
      el.style.fontWeight = '600';
      el.style.borderRadius = '6px';
      el.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      el.style.background = 'rgba(255, 255, 255, 0.1)';
      el.style.color = '#ffffff';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.15s ease';
      el.addEventListener('mouseenter', () => {
        el.style.background = 'rgba(255, 255, 255, 0.25)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.background = 'rgba(255, 255, 255, 0.1)';
      });
      el.addEventListener('click', btn.action);
      this.testToolbar.appendChild(el);
    }

    this.container.appendChild(this.testToolbar);
  }

  toggleTestToolbar() {
    if (!this.testToolbar) return;
    const isHidden = this.testToolbar.style.display === 'none';
    this.testToolbar.style.display = isHidden ? 'flex' : 'none';
  }

  updateStatus(status) {
    if (!this.statusPill) return;
    if (status === 'connected') {
      this.statusPill.style.borderColor = 'rgba(34, 197, 94, 0.4)';
      this.statusPill.style.color = '#4ade80';
      this.statusPill.innerText = 'TikTok Live: Connected';
    } else if (status === 'connecting') {
      this.statusPill.style.borderColor = 'rgba(234, 179, 8, 0.4)';
      this.statusPill.style.color = '#facc15';
      this.statusPill.innerText = 'TikTok Live: Connecting...';
    } else {
      this.statusPill.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      this.statusPill.style.color = '#94a3b8';
      this.statusPill.innerText = 'TikTok Live: Offline (Test Mode)';
    }
  }

  notifyGift(event) {
    if (!event || !this.bannerContainer) return;

    const nickname = event.user?.nickname || event.user?.name || 'Viewer';
    const giftName = event.data?.giftName || 'Gift';
    const count = event.data?.repeatCount || 1;
    const diamonds = event.data?.diamondCount || 1;

    // Check if an existing banner for the same user and gift exists (for streak updates)
    const existing = this.activeBanners.find(
      (b) => b.nickname === nickname && b.giftName === giftName
    );

    if (existing) {
      existing.updateCount(count);
      return;
    }

    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.gap = '12px';
    card.style.padding = '8px 16px';
    card.style.borderRadius = '24px';
    card.style.background = 'rgba(15, 23, 42, 0.85)';
    card.style.backdropFilter = 'blur(10px)';
    card.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
    card.style.opacity = '0';
    card.style.transform = 'translateX(-20px)';
    card.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

    const textGroup = document.createElement('div');
    textGroup.style.display = 'flex';
    textGroup.style.flexDirection = 'column';

    const senderText = document.createElement('span');
    senderText.style.fontSize = '12px';
    senderText.style.fontWeight = '700';
    senderText.style.color = '#f8fafc';
    senderText.innerText = nickname;

    const giftText = document.createElement('span');
    giftText.style.fontSize = '11px';
    giftText.style.color = '#fbbf24';
    giftText.innerText = 'sent ' + giftName + ' (' + diamonds + ' diamonds)';

    textGroup.appendChild(senderText);
    textGroup.appendChild(giftText);
    card.appendChild(textGroup);

    const countBadge = document.createElement('div');
    countBadge.style.fontSize = '16px';
    countBadge.style.fontWeight = '800';
    countBadge.style.color = '#38bdf8';
    countBadge.style.marginLeft = 'auto';
    countBadge.innerText = 'x' + count;
    card.appendChild(countBadge);

    this.bannerContainer.appendChild(card);

    // Animate in
    requestAnimationFrame(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateX(0)';
    });

    const bannerObj = {
      nickname,
      giftName,
      element: card,
      timer: null,
      updateCount: (newCount) => {
        countBadge.innerText = 'x' + newCount;
        countBadge.style.transform = 'scale(1.3)';
        setTimeout(() => {
          countBadge.style.transform = 'scale(1)';
        }, 150);
        bannerObj.resetTimer();
      },
      resetTimer: () => {
        if (bannerObj.timer) clearTimeout(bannerObj.timer);
        bannerObj.timer = setTimeout(() => {
          card.style.opacity = '0';
          card.style.transform = 'translateX(-20px)';
          setTimeout(() => {
            if (card.parentNode) card.parentNode.removeChild(card);
            this.activeBanners = this.activeBanners.filter((b) => b !== bannerObj);
          }, 300);
        }, 3500);
      }
    };

    bannerObj.resetTimer();
    this.activeBanners.push(bannerObj);
  }

  notifyChat(event) {
    // Optional brief chat toast if needed
    console.log('[LiveHUD] Chat: ' + event.user?.nickname + ': ' + event.data?.comment);
  }

  simulateGift(giftName, giftId, diamonds) {
    if (!this.interactionManager) return;
    const evt = {
      type: 'gift',
      user: {
        id: 'sim_user',
        name: 'live_viewer',
        nickname: 'Live Viewer',
        avatar: ''
      },
      data: {
        giftName,
        giftId,
        diamondCount: diamonds,
        repeatCount: 1
      },
      timestamp: Date.now()
    };
    this.interactionManager.handleIncomingEvent(evt);
  }

  simulateChat(comment) {
    if (!this.interactionManager) return;
    const evt = {
      type: 'chat',
      user: {
        id: 'sim_user',
        name: 'live_viewer',
        nickname: 'Live Viewer',
        avatar: ''
      },
      data: {
        comment
      },
      timestamp: Date.now()
    };
    this.interactionManager.handleIncomingEvent(evt);
  }
}

