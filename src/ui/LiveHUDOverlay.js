// Live HUD Overlay Component
// Implements 9:16 Mobile Safe Zones, gift celebration banners, and interactive test controls

export class LiveHUDOverlay {
  constructor(options = {}) {
    this.container = null;
    this.bannerContainer = null;
    this.statusPill = null;
    this.testToolbar = null;
    this.ambientToggleBtn = null;
    this.interactionManager = options.interactionManager || null;
    this.ambientFireworkManager = options.ambientFireworkManager || null;
    this.eventBus = options.eventBus || null;
    this.visible = true;
    this.activeBanners = [];
    this.chatContainer = null;
    this.spotlightBanner = null;
    this.activeChatMessages = [];
    this.statusFadeTimer = null;
    this.currentStatus = 'disconnected';

    this.initDOM();

    if (this.eventBus && typeof this.eventBus.on === 'function') {
      this.eventBus.on('sequence:gift_scheduled', (detail) => {
        if (detail && detail.giftInfo) {
          this.showGiftSpotlight(detail.giftInfo);
        }
      });
      this.eventBus.on('sequence:started', (detail) => {
        if (detail && detail.giftInfo) {
          this.showGiftSpotlight(detail.giftInfo);
        }
      });
      this.eventBus.on('sequence:ended', () => {
        this.hideGiftSpotlight();
      });
      this.eventBus.on('camera:third_person_focus', (detail) => {
        if (detail?.active && detail.character) {
          this.showSpectatorBadge(detail.character.name);
        } else {
          this.hideSpectatorBadge();
        }
      });
      this.eventBus.on('camera:spectator_tour_started', (detail) => {
        if (detail?.character) {
          this.showSpectatorBadge(detail.character.name);
        }
      });
      this.eventBus.on('camera:spectator_tour_advanced', (detail) => {
        if (detail?.character) {
          this.showSpectatorBadge(detail.character.name);
        }
      });
      this.eventBus.on('camera:spectator_tour_ended', () => {
        this.hideSpectatorBadge();
      });
    }
  }

  initDOM() {
    if (typeof document === 'undefined') return;

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
    this.bannerContainer.style.bottom = '38%';
    this.bannerContainer.style.display = 'flex';
    this.bannerContainer.style.flexDirection = 'column';
    this.bannerContainer.style.gap = '8px';
    this.bannerContainer.style.maxWidth = '380px';
    this.container.appendChild(this.bannerContainer);

    // Live Chat Stream Container (bottom left corner, large & clear font)
    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'live-chat-stream';
    this.chatContainer.style.position = 'absolute';
    this.chatContainer.style.left = '24px';
    this.chatContainer.style.bottom = '28px';
    this.chatContainer.style.display = 'flex';
    this.chatContainer.style.flexDirection = 'column';
    this.chatContainer.style.gap = '10px';
    this.chatContainer.style.maxWidth = '460px';
    this.chatContainer.style.pointerEvents = 'none';
    this.container.appendChild(this.chatContainer);

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
    this.statusPill.style.transition = 'opacity 0.4s ease, border-color 0.3s ease, color 0.3s ease';
    this.statusPill.title = 'Click to toggle Quick Test Controls';
    this.statusPill.innerText = 'TikTok Live: Disconnected';
    this.statusPill.addEventListener('click', () => this.toggleTestToolbar());
    this.statusPill.addEventListener('mouseenter', () => {
      this.statusPill.style.opacity = '1';
    });
    this.statusPill.addEventListener('mouseleave', () => {
      if (this.currentStatus === 'connected') {
        this.schedulePillFade();
      }
    });
    this.container.appendChild(this.statusPill);

    // Grand Gift Spotlight Banner (positioned at top center during gifted sequence)
    this.spotlightBanner = document.createElement('div');
    this.spotlightBanner.id = 'gift-spotlight-banner';
    this.spotlightBanner.style.position = 'absolute';
    this.spotlightBanner.style.top = '32px';
    this.spotlightBanner.style.left = '50%';
    this.spotlightBanner.style.transform = 'translateX(-50%) translateY(-20px)';
    this.spotlightBanner.style.display = 'flex';
    this.spotlightBanner.style.flexDirection = 'column';
    this.spotlightBanner.style.alignItems = 'center';
    this.spotlightBanner.style.gap = '4px';
    this.spotlightBanner.style.padding = '12px 32px';
    this.spotlightBanner.style.borderRadius = '24px';
    this.spotlightBanner.style.background = 'rgba(15, 23, 42, 0.90)';
    this.spotlightBanner.style.backdropFilter = 'blur(12px)';
    this.spotlightBanner.style.border = '2px solid rgba(245, 158, 11, 0.8)';
    this.spotlightBanner.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 24px rgba(245, 158, 11, 0.45)';
    this.spotlightBanner.style.opacity = '0';
    this.spotlightBanner.style.pointerEvents = 'none';
    this.spotlightBanner.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    this.spotlightBanner.style.zIndex = '10000';
    this.container.appendChild(this.spotlightBanner);

    // Spectator View Focus Badge (positioned at lower center during spectator focus / tour)
    this.spectatorBadge = document.createElement('div');
    this.spectatorBadge.id = 'spectator-focus-badge';
    this.spectatorBadge.style.position = 'absolute';
    this.spectatorBadge.style.bottom = '28px';
    this.spectatorBadge.style.left = '50%';
    this.spectatorBadge.style.transform = 'translateX(-50%) translateY(12px)';
    this.spectatorBadge.style.display = 'flex';
    this.spectatorBadge.style.alignItems = 'center';
    this.spectatorBadge.style.gap = '8px';
    this.spectatorBadge.style.padding = '8px 24px';
    this.spectatorBadge.style.borderRadius = '20px';
    this.spectatorBadge.style.background = 'rgba(15, 23, 42, 0.88)';
    this.spectatorBadge.style.backdropFilter = 'blur(10px)';
    this.spectatorBadge.style.border = '1px solid rgba(56, 189, 248, 0.6)';
    this.spectatorBadge.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5), 0 0 16px rgba(56, 189, 248, 0.25)';
    this.spectatorBadge.style.color = '#f8fafc';
    this.spectatorBadge.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.spectatorBadge.style.fontSize = '14px';
    this.spectatorBadge.style.fontWeight = '600';
    this.spectatorBadge.style.letterSpacing = '0.5px';
    this.spectatorBadge.style.opacity = '0';
    this.spectatorBadge.style.pointerEvents = 'none';
    this.spectatorBadge.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    this.spectatorBadge.style.zIndex = '9000';
    this.container.appendChild(this.spectatorBadge);

    // Quick Test Toolbar for streamer (bottom center, hidden by default, toggled via Hotkey or Pill)
    this.createTestToolbar();

    document.body.appendChild(this.container);

    // Clean Feed Hotkey (F10 to toggle all live HUD overlays for pristine streaming)
    // Quick Test Toolbar Hotkey (F9 to toggle offline test controls)
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'F10') {
          this.toggleCleanFeed();
        } else if (e.code === 'F9') {
          this.toggleTestToolbar();
        }
      });
    }

    // Bind interaction manager status if available
    if (this.interactionManager) {
      this.interactionManager.on('status', (status) => this.updateStatus(status));
      this.interactionManager.on('tiktok_room_status', (room) => this.updateRoomStatus(room));
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
    this.testToolbar.style.alignItems = 'center';
    this.testToolbar.style.gap = '8px';
    this.testToolbar.style.padding = '10px 16px';
    this.testToolbar.style.background = 'rgba(15, 23, 42, 0.90)';
    this.testToolbar.style.backdropFilter = 'blur(12px)';
    this.testToolbar.style.borderRadius = '12px';
    this.testToolbar.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    this.testToolbar.style.pointerEvents = 'auto';
    this.testToolbar.style.maxWidth = '90vw';

    // Account quick-connect input row
    const userRow = document.createElement('div');
    userRow.style.display = 'flex';
    userRow.style.alignItems = 'center';
    userRow.style.gap = '4px';
    userRow.style.marginRight = '8px';

    const userPrefix = document.createElement('span');
    userPrefix.innerText = '@';
    userPrefix.style.color = '#94a3b8';
    userPrefix.style.fontSize = '12px';
    userPrefix.style.fontWeight = '700';

    const userInput = document.createElement('input');
    userInput.type = 'text';
    userInput.value = 'thaolinn20';
    userInput.placeholder = 'username';
    userInput.style.padding = '5px 8px';
    userInput.style.fontSize = '12px';
    userInput.style.borderRadius = '6px';
    userInput.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    userInput.style.background = 'rgba(255, 255, 255, 0.08)';
    userInput.style.color = '#ffffff';
    userInput.style.width = '100px';

    const connectBtn = document.createElement('button');
    connectBtn.innerText = 'Connect';
    connectBtn.style.padding = '5px 10px';
    connectBtn.style.fontSize = '12px';
    connectBtn.style.fontWeight = '600';
    connectBtn.style.borderRadius = '6px';
    connectBtn.style.border = '1px solid rgba(56, 189, 248, 0.4)';
    connectBtn.style.background = 'rgba(56, 189, 248, 0.2)';
    connectBtn.style.color = '#38bdf8';
    connectBtn.style.cursor = 'pointer';
    connectBtn.addEventListener('click', () => {
      const username = userInput.value.trim();
      if (username && this.interactionManager) {
        this.interactionManager.setTargetUsername(username);
      }
    });

    userRow.appendChild(userPrefix);
    userRow.appendChild(userInput);
    userRow.appendChild(connectBtn);
    this.testToolbar.appendChild(userRow);

    const testButtons = [
      { label: 'Rose (1)', action: () => this.simulateGift('Rose', 5655, 1) },
      { label: 'Heart (5)', action: () => this.simulateGift('Finger Heart', 5882, 5) },
      { label: 'Confetti (100)', action: () => this.simulateGift('Confetti', 6064, 100) },
      { label: 'Fireworks (1088)', action: () => this.simulateGift('Fireworks', 6104, 1088) },
      { label: 'Universe (34999)', action: () => this.simulateGift('TikTok Universe', 6268, 34999) },
      { label: 'Chat: hello moi nguoi', action: () => this.simulateChat('hello moi nguoi') },
      { label: 'Chat: viet nam', action: () => this.simulateChat('viet nam') },
      { label: 'Chat !tim', action: () => this.simulateChat('!tim') },
      { label: 'Chat !phaohoa', action: () => this.simulateChat('!phaohoa') },
      { label: 'Like (2-4 phao)', action: () => this.simulateLike() }
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

    // Auto Fire Low-Altitude Ambient Toggle Button
    this.ambientToggleBtn = document.createElement('button');
    this.ambientToggleBtn.style.padding = '6px 12px';
    this.ambientToggleBtn.style.fontSize = '12px';
    this.ambientToggleBtn.style.fontWeight = '700';
    this.ambientToggleBtn.style.borderRadius = '6px';
    this.ambientToggleBtn.style.cursor = 'pointer';
    this.ambientToggleBtn.style.transition = 'all 0.15s ease';
    this.ambientToggleBtn.title = 'Toggle Auto Low-Altitude Ambient Fireworks (Hotkey: A)';
    const initialAutoState = this.ambientFireworkManager ? this.ambientFireworkManager.enabled : true;
    this.updateAmbientBtnState(initialAutoState);
    this.ambientToggleBtn.addEventListener('click', () => {
      if (this.ambientFireworkManager) {
        const nextState = this.ambientFireworkManager.toggle();
        this.updateAmbientBtnState(nextState);
      }
    });
    this.testToolbar.appendChild(this.ambientToggleBtn);

    // Custom Comment Input Row for Text Fireworks
    const chatRow = document.createElement('div');
    chatRow.style.display = 'flex';
    chatRow.style.alignItems = 'center';
    chatRow.style.gap = '6px';
    chatRow.style.width = '100%';
    chatRow.style.marginTop = '6px';

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.placeholder = 'Type comment to fire text fireworks (e.g. hello moi nguoi)...';
    chatInput.style.flex = '1';
    chatInput.style.padding = '6px 12px';
    chatInput.style.fontSize = '12px';
    chatInput.style.borderRadius = '6px';
    chatInput.style.border = '1px solid rgba(255, 255, 255, 0.25)';
    chatInput.style.background = 'rgba(0, 0, 0, 0.45)';
    chatInput.style.color = '#ffffff';
    chatInput.style.outline = 'none';

    const sendCommentBtn = document.createElement('button');
    sendCommentBtn.innerText = 'Fire Text';
    sendCommentBtn.style.padding = '6px 14px';
    sendCommentBtn.style.fontSize = '12px';
    sendCommentBtn.style.fontWeight = '600';
    sendCommentBtn.style.borderRadius = '6px';
    sendCommentBtn.style.border = '1px solid rgba(245, 158, 11, 0.6)';
    sendCommentBtn.style.background = 'rgba(245, 158, 11, 0.25)';
    sendCommentBtn.style.color = '#fbbf24';
    sendCommentBtn.style.cursor = 'pointer';
    sendCommentBtn.style.whiteSpace = 'nowrap';
    sendCommentBtn.style.transition = 'all 0.15s ease';

    const doSend = () => {
      const text = chatInput.value.trim();
      if (text) {
        this.simulateChat(text);
        chatInput.value = '';
      }
    };

    sendCommentBtn.addEventListener('click', doSend);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        doSend();
      }
    });

    chatRow.appendChild(chatInput);
    chatRow.appendChild(sendCommentBtn);
    this.testToolbar.appendChild(chatRow);

    this.container.appendChild(this.testToolbar);
  }

  updateAmbientBtnState(isEnabled) {
    if (!this.ambientToggleBtn) return;
    if (isEnabled) {
      this.ambientToggleBtn.innerText = 'Auto Fire: ON';
      this.ambientToggleBtn.style.background = 'rgba(34, 197, 94, 0.25)';
      this.ambientToggleBtn.style.border = '1px solid rgba(34, 197, 94, 0.6)';
      this.ambientToggleBtn.style.color = '#4ade80';
    } else {
      this.ambientToggleBtn.innerText = 'Auto Fire: OFF';
      this.ambientToggleBtn.style.background = 'rgba(239, 68, 68, 0.15)';
      this.ambientToggleBtn.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      this.ambientToggleBtn.style.color = '#f87171';
    }
  }

  updateAmbientToggleUI(isEnabled) {
    this.updateAmbientBtnState(isEnabled);
  }

  toggleTestToolbar() {
    if (!this.testToolbar) return;
    const isHidden = this.testToolbar.style.display === 'none';
    this.testToolbar.style.display = isHidden ? 'flex' : 'none';
    if (this.spectatorBadge) {
      this.spectatorBadge.style.bottom = isHidden ? '130px' : '28px';
    }
  }

  toggleCleanFeed() {
    if (!this.container) return;
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';
  }

  schedulePillFade() {
    if (this.statusFadeTimer) {
      clearTimeout(this.statusFadeTimer);
    }
    this.statusFadeTimer = setTimeout(() => {
      if (this.statusPill && this.currentStatus === 'connected') {
        this.statusPill.style.opacity = '0';
      }
    }, 3500);
  }

  updateStatus(status) {
    if (!this.statusPill) return;
    this.currentStatus = status;

    if (this.statusFadeTimer) {
      clearTimeout(this.statusFadeTimer);
      this.statusFadeTimer = null;
    }

    if (status === 'connected') {
      this.statusPill.style.borderColor = 'rgba(34, 197, 94, 0.4)';
      this.statusPill.style.color = '#4ade80';
      this.statusPill.innerText = 'TikTok Live: Connected';
      this.statusPill.style.opacity = '1';
      this.schedulePillFade();
    } else if (status === 'connecting') {
      this.statusPill.style.borderColor = 'rgba(234, 179, 8, 0.4)';
      this.statusPill.style.color = '#facc15';
      this.statusPill.innerText = 'TikTok Live: Connecting...';
      this.statusPill.style.opacity = '1';
    } else {
      this.statusPill.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      this.statusPill.style.color = '#94a3b8';
      this.statusPill.innerText = 'TikTok Live: Offline (Test Mode)';
      this.statusPill.style.opacity = '1';
    }
  }

  updateRoomStatus(roomEvent) {
    if (!this.statusPill || !roomEvent) return;
    const username = roomEvent.username || 'thaolinn20';

    if (this.statusFadeTimer) {
      clearTimeout(this.statusFadeTimer);
      this.statusFadeTimer = null;
    }

    if (roomEvent.status === 'connected') {
      this.statusPill.style.borderColor = 'rgba(34, 197, 94, 0.4)';
      this.statusPill.style.color = '#4ade80';
      this.statusPill.innerText = 'TikTok Live: @' + username + ' (Connected)';
      this.statusPill.style.opacity = '1';
      this.schedulePillFade();
    } else if (roomEvent.status === 'connecting') {
      this.statusPill.style.borderColor = 'rgba(234, 179, 8, 0.4)';
      this.statusPill.style.color = '#facc15';
      this.statusPill.innerText = 'TikTok Live: @' + username + ' (Connecting...)';
      this.statusPill.style.opacity = '1';
    } else if (roomEvent.status === 'error' || roomEvent.status === 'disconnected') {
      this.statusPill.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      this.statusPill.style.color = '#f87171';
      this.statusPill.innerText = 'TikTok Live: @' + username + ' (Waiting for stream...)';
      this.statusPill.style.opacity = '1';
    } else if (roomEvent.status === 'ended') {
      this.statusPill.style.borderColor = 'rgba(234, 179, 8, 0.4)';
      this.statusPill.style.color = '#facc15';
      this.statusPill.innerText = 'TikTok Live: @' + username + ' (Stream Ended)';
      this.statusPill.style.opacity = '1';
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
    if (!this.chatContainer) return;
    const user = event.user || {};
    const nickname = user.nickname || user.name || 'Viewer';
    const comment = event.data?.comment || '';
    if (!comment) return;

    this.showChatMessage(nickname, comment);
  }

  showChatMessage(nickname, comment) {
    if (!this.chatContainer) return;

    // Keep up to 4 most recent chat bubbles
    if (this.activeChatMessages.length >= 4) {
      const oldest = this.activeChatMessages.shift();
      if (oldest && oldest.element && oldest.element.parentNode) {
        oldest.element.parentNode.removeChild(oldest.element);
      }
    }

    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '4px';
    card.style.padding = '10px 16px';
    card.style.background = 'rgba(15, 23, 42, 0.88)';
    card.style.backdropFilter = 'blur(12px)';
    card.style.border = '1px solid rgba(255, 255, 255, 0.18)';
    card.style.borderLeft = '4px solid #38bdf8';
    card.style.borderRadius = '10px';
    card.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.45)';
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px)';
    card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    card.style.pointerEvents = 'none';

    // Header with user nickname
    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.alignItems = 'center';
    headerRow.style.gap = '8px';

    const nameEl = document.createElement('span');
    nameEl.innerText = nickname;
    nameEl.style.fontSize = '14px';
    nameEl.style.fontWeight = '700';
    nameEl.style.color = '#38bdf8';
    nameEl.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.8)';
    headerRow.appendChild(nameEl);

    // Comment text (large, bold, high contrast)
    const commentEl = document.createElement('div');
    commentEl.innerText = comment;
    commentEl.style.fontSize = '18px';
    commentEl.style.fontWeight = '600';
    commentEl.style.color = '#ffffff';
    commentEl.style.lineHeight = '1.35';
    commentEl.style.wordBreak = 'break-word';
    commentEl.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.9)';

    card.appendChild(headerRow);
    card.appendChild(commentEl);
    this.chatContainer.appendChild(card);

    requestAnimationFrame(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });

    const messageObj = {
      element: card,
      timer: null
    };

    messageObj.timer = setTimeout(() => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (card.parentNode) {
          card.parentNode.removeChild(card);
        }
        this.activeChatMessages = this.activeChatMessages.filter((m) => m !== messageObj);
      }, 300);
    }, 8000);

    this.activeChatMessages.push(messageObj);
  }

  notifyLike(event) {
    // Optional brief like toast if needed
    console.log('[LiveHUD] Like tap from ' + event.user?.nickname);
  }

  simulateLike() {
    if (!this.interactionManager) return;
    const evt = {
      type: 'like',
      user: {
        id: 'sim_user',
        name: 'live_viewer',
        nickname: 'Live Viewer',
        avatar: ''
      },
      data: {
        likeCount: 5,
        totalLikes: 100
      },
      timestamp: Date.now()
    };
    this.interactionManager.handleIncomingEvent(evt);
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

  showGiftSpotlight(giftInfo) {
    if (!this.spotlightBanner || !giftInfo) return;
    const userName = (giftInfo.userName || 'VIP Supporter').toUpperCase();
    const giftName = (giftInfo.giftName || 'Special Gift').toUpperCase();

    this.spotlightBanner.innerHTML = `
      <div style="font-size: 12px; font-weight: 700; color: #fbbf24; letter-spacing: 2px; text-transform: uppercase;">
        SPECIAL GRAND SHOW DEDICATED TO
      </div>
      <div style="font-size: 26px; font-weight: 900; color: #ffffff; text-shadow: 0 0 16px rgba(245, 158, 11, 0.7); letter-spacing: 1px;">
        ${userName}
      </div>
      <div style="font-size: 13px; font-weight: 600; color: #94a3b8; letter-spacing: 1px;">
        SPONSORED GIFT: <span style="color: #38bdf8;">${giftName}</span>
      </div>
    `;
    this.spotlightBanner.style.opacity = '1';
    this.spotlightBanner.style.transform = 'translateX(-50%) translateY(0)';
  }

  hideGiftSpotlight() {
    if (!this.spotlightBanner) return;
    this.spotlightBanner.style.opacity = '0';
    this.spotlightBanner.style.transform = 'translateX(-50%) translateY(-20px)';
  }

  showSpectatorBadge(name) {
    if (!this.spectatorBadge) return;
    this.spectatorBadge.innerText = 'Spectator: ' + (name || 'Viewer');
    this.spectatorBadge.style.opacity = '1';
    this.spectatorBadge.style.transform = 'translateX(-50%) translateY(0)';
  }

  hideSpectatorBadge() {
    if (!this.spectatorBadge) return;
    this.spectatorBadge.style.opacity = '0';
    this.spectatorBadge.style.transform = 'translateX(-50%) translateY(12px)';
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

