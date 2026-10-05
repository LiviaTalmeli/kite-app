// Kite Community Chat Controller
class ChatController {
  constructor() {
    this.feedContainer = document.getElementById('chat-messages-feed');
    this.inputField = document.getElementById('chat-input-field');
    this.sendBtn = document.getElementById('chat-send-btn');
    this.channelTabsContainer = document.getElementById('chat-channel-tabs');
    this.channelTitleEl = document.getElementById('chat-channel-title');
    this.channelDescEl = document.getElementById('chat-channel-desc');
    this.infodumpBtn = document.getElementById('infodump-toggle-btn');
    this.isInfodumpActive = false;
    this.selectedTone = '';

    this.init();
  }

  init() {
    this.renderChannelTabs();
    this.renderCurrentChannel();

    // Listen to state changes
    window.kiteState.subscribe((event, data) => {
      if (event === 'channel_changed') {
        this.renderCurrentChannel();
      } else if (event === 'chat_message_added' && data.channelId === window.kiteState.activeChannelId) {
        this.appendMessageElement(data.message);
        this.scrollToBottom();
      } else if (event === 'chat_reaction_updated') {
        this.renderCurrentChannel();
      }
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Send on button click
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    // Send on Enter key
    if (this.inputField) {
      this.inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    // Infodump toggle button
    if (this.infodumpBtn) {
      this.infodumpBtn.addEventListener('click', () => {
        this.isInfodumpActive = !this.isInfodumpActive;
        this.infodumpBtn.classList.toggle('active', this.isInfodumpActive);
        if (this.isInfodumpActive) {
          window.kiteApp.toast('Modo Infodump ativo! Sinta-se livre para detalhar tudo em profundidade. 📖', 'info');
        }
      });
    }

    // Tone indicators selector pills
    document.querySelectorAll('.tone-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tone = btn.dataset.tone;
        if (this.selectedTone === tone) {
          this.selectedTone = '';
          btn.classList.remove('active');
        } else {
          document.querySelectorAll('.tone-pill-btn').forEach(b => b.classList.remove('active'));
          this.selectedTone = tone;
          btn.classList.add('active');
        }
      });
    });
  }

  renderChannelTabs() {
    if (!this.channelTabsContainer) return;
    const channels = window.kiteState.channels;
    const currentId = window.kiteState.activeChannelId;

    this.channelTabsContainer.innerHTML = channels.map(c => `
      <button class="chat-tab-pill ${c.id === currentId ? 'active' : ''}" data-channel="${c.id}">
        <span>${c.icon}</span> #${c.name}
      </button>
    `).join('');

    this.channelTabsContainer.querySelectorAll('.chat-tab-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.channel;
        window.kiteState.setActiveChannel(targetId);
        this.channelTabsContainer.querySelectorAll('.chat-tab-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  renderCurrentChannel() {
    const currentId = window.kiteState.activeChannelId;
    const channel = window.kiteState.channels.find(c => c.id === currentId) || window.kiteState.channels[0];

    if (this.channelTitleEl) {
      this.channelTitleEl.innerHTML = `${channel.icon} #${channel.name}`;
    }
    if (this.channelDescEl) {
      this.channelDescEl.innerText = channel.desc;
    }

    const messages = window.kiteState.messages[currentId] || [];
    if (!this.feedContainer) return;

    this.feedContainer.innerHTML = messages.map(msg => this.buildMessageHTML(msg)).join('');
    this.attachReactionListeners();
    this.scrollToBottom();
  }

  buildMessageHTML(msg) {
    const isMe = msg.isMe;
    const reactionsHTML = msg.reactions ? Object.entries(msg.reactions).map(([emoji, count]) => `
      <button class="reaction-chip" data-msg-id="${msg.id}" data-emoji="${emoji}">
        <span>${emoji}</span>
        <span>${count}</span>
      </button>
    `).join('') : '';

    return `
      <div class="message-card ${isMe ? 'is-me' : ''}" id="msg-${msg.id}">
        <div class="message-avatar">${msg.avatar || (isMe ? 'EU' : 'ND')}</div>
        <div class="message-content-wrap">
          <div class="message-meta">
            <span class="message-author">${msg.author}</span>
            ${msg.badge ? `<span class="message-badge">${msg.badge}</span>` : ''}
            <span>${msg.time || 'Hoje'}</span>
          </div>
          ${msg.isInfodump ? `<div class="infodump-tag">📖 Infodump Seguro</div>` : ''}
          <div class="message-bubble">
            ${msg.tone ? `<span class="message-tone-tag">${msg.tone}</span>` : ''}
            ${this.escapeHTML(msg.body)}
          </div>
          ${reactionsHTML ? `<div class="message-reactions">${reactionsHTML}</div>` : ''}
        </div>
      </div>
    `;
  }

  appendMessageElement(msg) {
    if (!this.feedContainer) return;
    const html = this.buildMessageHTML(msg);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const msgEl = tempDiv.firstElementChild;
    this.feedContainer.appendChild(msgEl);
    this.attachReactionListeners(msgEl);
  }

  attachReactionListeners(scope = document) {
    scope.querySelectorAll('.reaction-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const msgId = btn.dataset.msgId;
        const emoji = btn.dataset.emoji;
        window.kiteState.toggleReaction(window.kiteState.activeChannelId, msgId, emoji);
      });
    });
  }

  handleSendMessage() {
    const rawText = this.inputField.value.trim();
    if (!rawText) return;

    const user = window.kiteState.user || {
      name: 'Você',
      avatar: 'EU',
      badges: ['Altas Habilidades']
    };

    const newMsg = {
      id: 'm_' + Date.now(),
      author: user.name,
      avatar: user.avatar || 'EU',
      badge: (user.badges && user.badges[0]) || 'Altas Habilidades',
      tone: this.selectedTone || null,
      isInfodump: this.isInfodumpActive,
      body: rawText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      reactions: { '💡': 1, '🪁': 1 }
    };

    const channelId = window.kiteState.activeChannelId;
    window.kiteState.addChatMessage(channelId, newMsg);

    this.inputField.value = '';
    this.inputField.focus();

    // Reset temporary states
    if (this.selectedTone) {
      this.selectedTone = '';
      document.querySelectorAll('.tone-pill-btn').forEach(b => b.classList.remove('active'));
    }

    // Trigger realistic community peer response after brief natural delay
    this.triggerSimulatedPeerReply(channelId, rawText);
  }

  triggerSimulatedPeerReply(channelId, userMessageText) {
    setTimeout(() => {
      if (channelId !== window.kiteState.activeChannelId) return;

      const peers = [
        {
          author: 'Clara Ramos',
          avatar: 'CR',
          badge: 'AH/SD • 2e',
          replies: [
            'Totalmente! É maravilhoso ler isso. A forma como seu cérebro conectou essas ideias é exatamente o que torna nossa comunidade tão especial!',
            'Concordo 100%! /gen Quando encontro pessoas que compartilham dessa mesma intensidade cognitiva, sinto que finalmente posso falar na minha velocidade natural.',
            'Obrigada por compartilhar isso aqui! Na neurodivergência com altas habilidades, essa profundidade de reflexão é essencial.'
          ]
        },
        {
          author: 'Lucas Fontes',
          avatar: 'LF',
          badge: 'AuDHD',
          replies: [
            'Nossa, ressoou muito comigo! /pos Também passei por isso recentemente. O segredo é validar esse processo sem tentar se encaixar no padrão neurotípico.',
            'Excelente colocação! /gen É muito comum sentirmos que estamos "pensando demais", mas na verdade estamos apenas processando o mundo na nossa resolução.',
            'Sensacional! Adorei a perspectiva. Já salvou meu dia ler essa reflexão por aqui!'
          ]
        },
        {
          author: 'Beatriz Lima',
          avatar: 'BL',
          badge: 'Psicóloga • 2e',
          replies: [
            'Como psicóloga e também pessoa 2e, acho fundamental normalizarmos essas vivências. Parabéns pela clareza e coragem de se expressar!',
            'Isso tem tudo a ver com a teoria da desintegração positiva de Dabrowski: essas crises e questionamentos profundos são os motores do nosso crescimento.'
          ]
        }
      ];

      const peer = peers[Math.floor(Math.random() * peers.length)];
      const randomReply = peer.replies[Math.floor(Math.random() * peer.replies.length)];

      const peerMsg = {
        id: 'reply_' + Date.now(),
        author: peer.author,
        avatar: peer.avatar,
        badge: peer.badge,
        tone: '/gen',
        body: randomReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
        reactions: { '❤️': 2, '🪁': 3 }
      };

      window.kiteState.addChatMessage(channelId, peerMsg);
    }, 1800);
  }

  scrollToBottom() {
    if (this.feedContainer) {
      this.feedContainer.scrollTop = this.feedContainer.scrollHeight;
    }
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }
}

window.ChatController = ChatController;
