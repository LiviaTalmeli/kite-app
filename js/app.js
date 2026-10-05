// Kite App Main Bootstrapper & Router
class KiteApp {
  constructor() {
    this.currentView = 'chat';
    this.views = {
      feed: document.getElementById('view-feed'),
      chat: document.getElementById('view-chat'),
      ai: document.getElementById('view-ai'),
      tools: document.getElementById('view-tools'),
      profile: document.getElementById('view-profile')
    };

    this.init();
  }

  init() {
    // Initialize Subsystem Controllers
    this.auth = new window.AuthController();
    this.chat = new window.ChatController();
    this.ai = new window.AiController();
    this.tools = new window.ToolsController();

    this.setupNavigation();
    this.setupSettingsEvents();
    this.setupDesktopToggles();
    this.setupClock();
    this.registerServiceWorker();

    // Default to Chat View
    this.switchView('chat');
  }

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;
        this.switchView(targetView);
      });
    });

    // Feed banner AI prompt jump
    const bannerAiBtn = document.getElementById('feed-banner-ai-btn');
    if (bannerAiBtn) {
      bannerAiBtn.addEventListener('click', () => {
        this.switchView('ai');
      });
    }
  }

  switchView(viewName) {
    if (!this.views[viewName]) return;
    this.currentView = viewName;

    // Toggle view containers
    Object.keys(this.views).forEach(key => {
      if (this.views[key]) {
        this.views[key].style.display = key === viewName ? 'flex' : 'none';
      }
    });

    // Update bottom nav active state
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    window.kiteState.setActiveView(viewName);
  }

  setupSettingsEvents() {
    // Sensory friendly switch
    const sensorySwitch = document.getElementById('setting-sensory-mode');
    if (sensorySwitch) {
      sensorySwitch.checked = window.kiteState.settings.sensoryFriendly;
      this.applySensoryMode(sensorySwitch.checked);

      sensorySwitch.addEventListener('change', (e) => {
        const val = e.target.checked;
        window.kiteState.updateSettings({ sensoryFriendly: val });
        this.applySensoryMode(val);
        this.toast(val ? 'Modo Baixo Estímulo Sensorial ativado! 🌿' : 'Modo padrão ativado.', 'info');
      });
    }

    // Theme selector
    const themeSelect = document.getElementById('setting-theme-select');
    if (themeSelect) {
      themeSelect.value = window.kiteState.settings.theme;
      this.applyTheme(themeSelect.value);

      themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        window.kiteState.updateSettings({ theme });
        this.applyTheme(theme);
      });
    }
  }

  applySensoryMode(enabled) {
    document.body.classList.toggle('sensory-friendly', enabled);
  }

  applyTheme(theme) {
    document.body.classList.remove('theme-sage', 'theme-dark');
    if (theme === 'sage') {
      document.body.classList.add('theme-sage');
    } else if (theme === 'dark') {
      document.body.classList.add('theme-dark');
    }
  }

  setupDesktopToggles() {
    const toggleViewBtn = document.getElementById('toggle-simulator-view-btn');
    if (toggleViewBtn) {
      toggleViewBtn.addEventListener('click', () => {
        const isFullscreen = document.body.classList.toggle('fullscreen-mode');
        toggleViewBtn.innerHTML = isFullscreen 
          ? '📱 Visualizar como Smartphone' 
          : '💻 Tela Cheia / Desktop';
      });
    }
  }

  setupClock() {
    const clockEl = document.getElementById('phone-clock');
    if (!clockEl) return;

    const updateTime = () => {
      const now = new Date();
      clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    updateTime();
    setInterval(updateTime, 30000);
  }

  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '🪁';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
          console.log('SW registration optional:', err);
        });
      });
    }
  }
}

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.kiteApp = new KiteApp();
});
