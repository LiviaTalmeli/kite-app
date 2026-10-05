// Kite Application State Store & Data Models
const STORAGE_KEYS = {
  USER: 'kite_current_user',
  SETTINGS: 'kite_user_settings',
  CHAT_MESSAGES: 'kite_chat_messages',
  AI_HISTORY: 'kite_ai_history',
  CUSTOM_API_KEY: 'kite_custom_api_key'
};

// Initial Community Channels
const INITIAL_CHANNELS = [
  {
    id: 'geral',
    name: 'comunidade-geral',
    icon: '🪁',
    desc: 'Boas-vindas, conversas livres e espaço seguro sem julgamentos'
  },
  {
    id: 'hiperfoco',
    name: 'hiperfoco-e-paixoes',
    icon: '⚡',
    desc: 'Compartilhe seus interesses profundos sem medo de falar demais'
  },
  {
    id: 'dupla-excepcionalidade',
    name: 'dupla-excepcionalidade-2e',
    icon: '🧩',
    desc: 'Para mentes que combinam Altas Habilidades com TDAH, Autismo ou Dislexia'
  },
  {
    id: 'sobre-excitabilidade',
    name: 'sobre-excitabilidades',
    icon: '🧠',
    desc: 'Intensidades emocionais, intelectuais, sensoriais e imaginativas (Dabrowski)'
  },
  {
    id: 'carreira-e-vida',
    name: 'vida-adulta-e-carreira',
    icon: '💼',
    desc: 'Síndrome do impostor, tédio profissional, transições e burnout'
  }
];

// Initial Seed Messages for Gifted/Neurodivergent Community
const INITIAL_MESSAGES = {
  'geral': [
    {
      id: 'm1',
      author: 'Clara Ramos',
      badge: 'AH/SD • 2e',
      avatar: 'CR',
      tone: '/gen',
      body: 'Sejam bem-vindos ao Kite! É tão libertador encontrar um espaço onde não precisamos nos desculpar pela velocidade do nosso raciocínio.',
      time: '10:14',
      isMe: false,
      reactions: { '💡': 5, '❤️': 8, '🪁': 12 }
    },
    {
      id: 'm2',
      author: 'Lucas Fontes',
      badge: 'AuDHD',
      avatar: 'LF',
      tone: '/info',
      body: 'Descobri minha superdotação aos 28 anos depois de um burnout. Alguém mais aqui teve diagnóstico tardio? Mudou completamente como entendo minhas sobre-excitabilidades.',
      time: '10:22',
      isMe: false,
      reactions: { '🧠': 9, '❤️': 6 }
    }
  ],
  'hiperfoco': [
    {
      id: 'm3',
      author: 'Matheus Reis',
      badge: 'Astrofísica & AH/SD',
      avatar: 'MR',
      tone: '/gen',
      isInfodump: true,
      body: '📖 [INFODUMP]: Passei as últimas 72 horas lendo papers sobre entropia e termodinâmica de buracos negros. É fascinante como a informação quântica na superfície do horizonte de eventos resolve o paradoxo da informação de Hawking!',
      time: '09:05',
      isMe: false,
      reactions: { '⚡': 14, '💡': 11 }
    }
  ],
  'dupla-excepcionalidade': [
    {
      id: 'm4',
      author: 'Beatriz Lima',
      badge: 'Psicóloga • 2e',
      avatar: 'BL',
      tone: '/srs',
      body: 'Lembrete gentil: ser 2e (Dupla Excepcionalidade) não é "equilibrar" forças. O lado com altas habilidades costuma mascarar o TDAH/TEA, e o TDAH/TEA mascara a superdotação. A exaustão é real e válida!',
      time: 'Ontem',
      isMe: false,
      reactions: { '❤️': 22, '💡': 18 }
    }
  ],
  'sobre-excitabilidade': [
    {
      id: 'm5',
      author: 'Ana Valente',
      badge: 'Intensidade Emocional',
      avatar: 'AV',
      tone: '/vent',
      body: 'Às vezes sinto uma sobrecarga sensorial e empatia tão dolorosa pelo que vejo nas notícias que preciso me desligar por 2 dias. A sobre-excitabilidade emocional de Dabrowski explica tanto sobre minha vida.',
      time: 'Ontem',
      isMe: false,
      reactions: { '❤️': 15, '🪁': 9 }
    }
  ],
  'carreira-e-vida': [
    {
      id: 'm6',
      author: 'Diego S.',
      badge: 'Arquiteto de Sistemas',
      avatar: 'DS',
      tone: '/gen',
      body: 'Dica prática para quem sente o tédio existencial no trabalho: crie mini-desafios e projetos paralelos de automação. Se a empresa não desafia seu intelecto, proteja sua energia para seus próprios hiperfocos.',
      time: '08:40',
      isMe: false,
      reactions: { '🎯': 16, '💡': 7 }
    }
  ]
};

// Initial AI Welcome Conversation
const INITIAL_AI_CHAT = [
  {
    role: 'assistant',
    text: `Olá! Sou o **Kite IA**, seu assistente especializado em **Altas Habilidades, Superdotação e Neurodiversidade**.\n\nAqui você tem um espaço sem julgamentos para entender suas intensidades, sobre-excitabilidades, dupla excepcionalidade (2e), hiperfoco ou burnout.\n\nComo posso apoiar sua mente hoje? Sinta-se à vontade para perguntar qualquer coisa ou escolher um dos temas sugeridos acima! 🪁`,
    time: 'Agora'
  }
];

class StateManager {
  constructor() {
    this.user = this.load(STORAGE_KEYS.USER, null);
    this.settings = this.load(STORAGE_KEYS.SETTINGS, {
      sensoryFriendly: false,
      theme: 'purple', // 'purple', 'sage', 'dark'
      soundEffects: true,
      toneIndicatorsRequired: false,
      fontSize: 'normal'
    });
    this.channels = INITIAL_CHANNELS;
    this.activeChannelId = 'geral';
    this.activeView = 'chat'; // 'feed', 'chat', 'ai', 'tools', 'profile'
    this.messages = this.load(STORAGE_KEYS.CHAT_MESSAGES, INITIAL_MESSAGES);
    this.aiHistory = this.load(STORAGE_KEYS.AI_HISTORY, INITIAL_AI_CHAT);
    this.customApiKey = this.load(STORAGE_KEYS.CUSTOM_API_KEY, '');
    this.listeners = [];
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify(event, payload) {
    this.listeners.forEach(cb => cb(event, payload));
  }

  setUser(userData) {
    this.user = userData;
    this.save(STORAGE_KEYS.USER, this.user);
    this.notify('user_changed', this.user);
  }

  updateSettings(partial) {
    this.settings = { ...this.settings, ...partial };
    this.save(STORAGE_KEYS.SETTINGS, this.settings);
    this.notify('settings_changed', this.settings);
  }

  setActiveView(viewName) {
    this.activeView = viewName;
    this.notify('view_changed', viewName);
  }

  setActiveChannel(channelId) {
    this.activeChannelId = channelId;
    this.notify('channel_changed', channelId);
  }

  addChatMessage(channelId, message) {
    if (!this.messages[channelId]) {
      this.messages[channelId] = [];
    }
    this.messages[channelId].push(message);
    this.save(STORAGE_KEYS.CHAT_MESSAGES, this.messages);
    this.notify('chat_message_added', { channelId, message });
  }

  toggleReaction(channelId, messageId, emoji) {
    const list = this.messages[channelId] || [];
    const msg = list.find(m => m.id === messageId);
    if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
    this.save(STORAGE_KEYS.CHAT_MESSAGES, this.messages);
    this.notify('chat_reaction_updated', { channelId, messageId, emoji });
  }

  addAiMessage(role, text) {
    const msg = {
      role,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.aiHistory.push(msg);
    this.save(STORAGE_KEYS.AI_HISTORY, this.aiHistory);
    this.notify('ai_message_added', msg);
  }

  clearAiHistory() {
    this.aiHistory = [...INITIAL_AI_CHAT];
    this.save(STORAGE_KEYS.AI_HISTORY, this.aiHistory);
    this.notify('ai_cleared');
  }
}

window.kiteState = new StateManager();
