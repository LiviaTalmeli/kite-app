// Kite Authentication & User Profile Logic
class AuthController {
  constructor() {
    this.authContainer = document.getElementById('auth-screen');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.isRegisterMode = false;
    this.selectedTags = new Set(['Altas Habilidades / Superdotação']);

    this.init();
  }

  init() {
    // Listen to state changes
    window.kiteState.subscribe((event, data) => {
      if (event === 'user_changed') {
        this.updateAuthVisibility();
      }
    });

    this.setupEventListeners();
    this.updateAuthVisibility();
  }

  updateAuthVisibility() {
    const user = window.kiteState.user;
    if (user) {
      this.authContainer.classList.add('hidden');
      this.renderUserProfile(user);
    } else {
      this.authContainer.classList.remove('hidden');
    }
  }

  setupEventListeners() {
    // Switch between Login and Register
    const switchBtn = document.getElementById('auth-switch-btn');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        this.toggleAuthMode();
      });
    }

    // Login Form Submit
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value;

        if (!identifier || !password) {
          window.kiteApp.toast('Por favor, preencha todos os campos.', 'warning');
          return;
        }

        // Mock login / authenticate
        const namePart = identifier.includes('@') ? identifier.split('@')[0] : identifier;
        const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

        const user = {
          id: 'u_' + Date.now(),
          name: displayName,
          username: '@' + namePart.toLowerCase().replace(/\s+/g, '_'),
          email: identifier.includes('@') ? identifier : `${identifier.toLowerCase()}@exemplo.com`,
          badges: ['Membro Kite', 'Altas Habilidades / SD'],
          hyperfocus: ['Tecnologia', 'Ciência', 'Psicologia'],
          avatar: displayName.slice(0, 2).toUpperCase()
        };

        window.kiteState.setUser(user);
        window.kiteApp.toast(`Bem-vindo(a) de volta ao Kite, ${user.name}! 🪁`, 'success');
      });
    }

    // Register Form Submit
    if (this.registerForm) {
      this.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        if (!name || !username || !email || !password) {
          window.kiteApp.toast('Por favor, preencha todos os campos.', 'warning');
          return;
        }

        const tagsArray = Array.from(this.selectedTags);
        const user = {
          id: 'u_' + Date.now(),
          name: name,
          username: username.startsWith('@') ? username : '@' + username,
          email: email,
          badges: tagsArray.length > 0 ? tagsArray : ['Membro Kite', 'Altas Habilidades'],
          hyperfocus: ['Curiosidade Profunda', 'Inovação'],
          avatar: name.slice(0, 2).toUpperCase()
        };

        window.kiteState.setUser(user);
        window.kiteApp.toast(`Conta criada com sucesso! Bem-vindo(a), ${user.name}! 🪁`, 'success');
      });
    }

    // Guest / Quick Login
    const guestBtn = document.getElementById('guest-login-btn');
    if (guestBtn) {
      guestBtn.addEventListener('click', () => {
        const guestUser = {
          id: 'u_guest',
          name: 'Explorador(a)',
          username: '@explorador_kite',
          email: 'explorador@kite.app',
          badges: ['Altas Habilidades', 'Dupla Excepcionalidade (2e)'],
          hyperfocus: ['Filosofia da Mente', 'Inteligência Artificial', 'Música'],
          avatar: 'EX'
        };
        window.kiteState.setUser(guestUser);
        window.kiteApp.toast('Entrando em modo demonstração no Kite! 🪁', 'info');
      });
    }

    // Interactive Tag selection in registration
    document.querySelectorAll('.auth-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        if (this.selectedTags.has(tag)) {
          this.selectedTags.delete(tag);
          chip.classList.remove('active');
        } else {
          this.selectedTags.add(tag);
          chip.classList.add('active');
        }
      });
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.kiteState.setUser(null);
        window.kiteApp.toast('Você saiu da sua conta com segurança.', 'info');
      });
    }
  }

  toggleAuthMode() {
    this.isRegisterMode = !this.isRegisterMode;
    const title = document.getElementById('auth-title-text');
    const subtitle = document.getElementById('auth-subtitle-text');
    const switchBtn = document.getElementById('auth-switch-btn');
    
    if (this.isRegisterMode) {
      this.loginForm.style.display = 'none';
      this.registerForm.style.display = 'flex';
      title.innerText = 'CRIAR CONTA';
      subtitle.innerText = 'Personalize seu espaço neurodivergente e conecte-se com mentes afins.';
      switchBtn.innerHTML = 'Já possui uma conta? <span>Entrar</span>';
    } else {
      this.loginForm.style.display = 'flex';
      this.registerForm.style.display = 'none';
      title.innerText = 'KITE';
      subtitle.innerText = 'Venha fazer parte da nossa comunidade!';
      switchBtn.innerHTML = 'Ainda não possui uma conta? <span>Cadastre-se</span>';
    }
  }

  renderUserProfile(user) {
    const profileNameEl = document.getElementById('profile-display-name');
    const profileUsernameEl = document.getElementById('profile-display-username');
    const profileAvatarEl = document.getElementById('profile-display-avatar');
    const profileBadgesContainer = document.getElementById('profile-display-badges');
    const chatUserAvatarEl = document.getElementById('chat-my-avatar');

    if (profileNameEl) profileNameEl.innerText = user.name;
    if (profileUsernameEl) profileUsernameEl.innerText = user.username;
    if (profileAvatarEl) profileAvatarEl.innerText = user.avatar;
    if (chatUserAvatarEl) chatUserAvatarEl.innerText = user.avatar;

    if (profileBadgesContainer && user.badges) {
      profileBadgesContainer.innerHTML = user.badges.map(b => `
        <span class="tool-badge-pill" style="margin: 2px;">${b}</span>
      `).join('');
    }
  }
}

window.AuthController = AuthController;
