// Kite AI Assistant - Specialized in Giftedness (AH/SD), 2e, and Neurodiversity
class AiController {
  constructor() {
    this.chatFeed = document.getElementById('ai-chat-feed');
    this.inputField = document.getElementById('ai-input-field');
    this.sendBtn = document.getElementById('ai-send-btn');
    this.clearBtn = document.getElementById('ai-clear-btn');
    this.apiKeyModal = document.getElementById('api-key-modal');
    this.apiKeyInput = document.getElementById('api-key-input');
    this.isResponding = false;

    this.init();
  }

  init() {
    this.renderHistory();

    window.kiteState.subscribe((event, data) => {
      if (event === 'ai_message_added') {
        this.renderHistory();
      } else if (event === 'ai_cleared') {
        this.renderHistory();
      }
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Send on button
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleUserMessage());
    }

    // Send on Enter
    if (this.inputField) {
      this.inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleUserMessage();
        }
      });
    }

    // Clear chat history
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        if (confirm('Deseja reiniciar a conversa com o Kite IA?')) {
          window.kiteState.clearAiHistory();
          window.kiteApp.toast('Conversa reiniciada.', 'info');
        }
      });
    }

    // Prompt chips
    document.querySelectorAll('.ai-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query || chip.innerText.trim();
        this.askQuestion(query);
      });
    });

    // API Key config button
    const apiKeyBtn = document.getElementById('ai-config-key-btn');
    if (apiKeyBtn) {
      apiKeyBtn.addEventListener('click', () => {
        const currentKey = window.kiteState.customApiKey || '';
        const userKey = prompt('Deseja configurar uma Chave de API externa (Gemini ou OpenAI)? Deixe em branco para usar o motor neural nativo do Kite:', currentKey);
        if (userKey !== null) {
          window.kiteState.customApiKey = userKey.trim();
          window.kiteState.save('kite_custom_api_key', userKey.trim());
          window.kiteApp.toast(userKey ? 'Chave de API salva com sucesso!' : 'Usando motor neural integrado do Kite.', 'success');
        }
      });
    }
  }

  askQuestion(text) {
    if (this.inputField) {
      this.inputField.value = text;
      this.handleUserMessage();
    }
  }

  renderHistory() {
    if (!this.chatFeed) return;
    const history = window.kiteState.aiHistory || [];

    this.chatFeed.innerHTML = history.map((msg, index) => {
      const isUser = msg.role === 'user';
      return `
        <div class="ai-msg ${isUser ? 'user' : 'assistant'}">
          <div class="ai-msg-avatar">${isUser ? '👤' : '🪁'}</div>
          <div class="ai-msg-content" style="max-width: 86%;">
            <div class="ai-bubble">
              ${this.formatMarkdown(msg.text)}
              ${!isUser ? `
                <div class="ai-bubble-toolbar">
                  <button class="ai-tool-btn tts-btn" data-text="${encodeURIComponent(msg.text)}">
                    🔊 Ouvir
                  </button>
                  <button class="ai-tool-btn copy-btn" data-text="${encodeURIComponent(msg.text)}">
                    📋 Copiar
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.attachMessageActions();
    this.scrollToBottom();
  }

  attachMessageActions() {
    // Text to Speech
    this.chatFeed.querySelectorAll('.tts-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.dataset.text);
        this.speakText(text, btn);
      });
    });

    // Copy to Clipboard
    this.chatFeed.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.dataset.text);
        navigator.clipboard.writeText(text).then(() => {
          window.kiteApp.toast('Resposta copiada para a área de transferência!', 'success');
        }).catch(() => {
          window.kiteApp.toast('Não foi possível copiar o texto.', 'warning');
        });
      });
    });
  }

  speakText(text, btnElement) {
    if (!('speechSynthesis' in window)) {
      window.kiteApp.toast('Síntese de voz não suportada neste navegador.', 'warning');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      btnElement.innerText = '🔊 Ouvir';
      return;
    }

    // Clean markdown before speaking
    const cleanText = text.replace(/[*_#`>-]/g, '').replace(/\[.*?\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;

    btnElement.innerText = '⏹️ Parar';
    utterance.onend = () => {
      btnElement.innerText = '🔊 Ouvir';
    };
    utterance.onerror = () => {
      btnElement.innerText = '🔊 Ouvir';
    };

    window.speechSynthesis.speak(utterance);
  }

  handleUserMessage() {
    if (this.isResponding) return;
    const text = this.inputField.value.trim();
    if (!text) return;

    window.kiteState.addAiMessage('user', text);
    this.inputField.value = '';
    this.isResponding = true;

    // Show typing indicator
    this.showTypingIndicator();

    setTimeout(() => {
      this.generateSpecializedResponse(text).then(reply => {
        this.hideTypingIndicator();
        window.kiteState.addAiMessage('assistant', reply);
        this.isResponding = false;
      }).catch(err => {
        this.hideTypingIndicator();
        window.kiteState.addAiMessage('assistant', 'Desculpe, ocorreu um imprevisto ao processar sua dúvida. Por favor, tente novamente!');
        this.isResponding = false;
      });
    }, 1000);
  }

  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'ai-typing-box';
    indicator.className = 'ai-msg assistant';
    indicator.innerHTML = `
      <div class="ai-msg-avatar">🪁</div>
      <div class="ai-bubble">
        <div class="ai-typing-indicator">
          <div class="ai-dot"></div>
          <div class="ai-dot"></div>
          <div class="ai-dot"></div>
        </div>
      </div>
    `;
    this.chatFeed.appendChild(indicator);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const el = document.getElementById('ai-typing-box');
    if (el) el.remove();
  }

  async generateSpecializedResponse(prompt) {
    // If user provided custom API key, try calling external model
    const apiKey = window.kiteState.customApiKey;
    if (apiKey && apiKey.startsWith('AIza')) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Você é o Kite IA, um assistente acolhedor, empático e cientificamente embasado, especializado em Neurodiversidade, Altas Habilidades/Superdotação (AH/SD) e Dupla Excepcionalidade (2e). Responda com carinho, validação e estrutura em markdown com tópicos práticos.\n\nPergunta do usuário: ${prompt}`
              }]
            }]
          })
        });
        const data = await resp.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (err) {
        console.warn('Fallback to internal knowledge engine:', err);
      }
    }

    // Knowledge Engine (Local Specialized Neurodiversity & Giftedness AI)
    return this.consultKnowledgeBase(prompt);
  }

  consultKnowledgeBase(query) {
    const q = query.toLowerCase();

    // 1. Sobre-excitabilidades de Dabrowski
    if (q.includes('sobre-excit') || q.includes('dabrowski') || q.includes('intensidade') || q.includes('overexcitab')) {
      return `### 🧠 As 5 Sobre-excitabilidades de Dabrowski (AH/SD)

O psiquiatra polonês **Kazimierz Dąbrowski** identificou que pessoas com altas habilidades experienciam o mundo através de um sistema nervoso com maior capacidade de resposta a estímulos (tradução livre de *Overexcitabilities* / OE):

1. **Sobre-excitabilidade Intelectual**:
   * Sede insaciável por conhecimento, verdades lógicas e solução de problemas complexos.
   * Dificuldade de tolerar informações superficiais ou respostas vazias.

2. **Sobre-excitabilidade Imaginativa**:
   * Pensamento visual vívido, metáforas ricas, imaginação fértil e criação de cenários mentais detalhados.
   * Frequentemente sonham acordados ou se refugiam na fantasia criativa.

3. **Sobre-excitabilidade Emocional**:
   * Sentimentos de intensidade extrema (alegria radiante ou dor empática avassaladora).
   * Forte senso de justiça, apego profundo a pessoas e animais, e suscetibilidade à ansiedade existencial.

4. **Sobre-excitabilidade Psicomotora**:
   * Excesso de energia neuromuscular, fala rápida, gesticulação intensa e necessidade de se mover quando empolgado.
   * Muitas vezes confundida com a hiperatividade física do TDAH.

5. **Sobre-excitabilidade Sensorial**:
   * Sensibilidade aguçada aos 5 sentidos: incômodo com etiquetas de roupas, luzes fluorescentes, ruídos de fundo ou texturas alimentares.
   * Apreciação profunda por música, arte e estética.

💡 **Dica de Cuidado:** Reconhecer suas sobre-excitabilidades não é um defeito de caráter, mas a forma biológica como seu cérebro processa o mundo.`;
    }

    // 2. Dupla Excepcionalidade (2e)
    if (q.includes('dupla excepc') || q.includes('2e') || q.includes('tdah') || q.includes('autis') || q.includes('audhd')) {
      return `### 🧩 O que é Dupla Excepcionalidade (2e / Twice-Exceptional)?

A **Dupla Excepcionalidade (2e)** ocorre quando uma pessoa apresenta simultaneamente **Altas Habilidades/Superdotação** e uma ou mais condições neurodivergentes (como **TDAH**, **Autismo/TEA**, **Dislexia**, **Discalculia** ou **Dispraxia**).

#### O Efeito do Mascaramento Mútuo:
* **A inteligência mascara as dificuldades:** O intelecto compensa as falhas de atenção executiva ou leitura, fazendo com que a pessoa pareça "na média" para professores e familiares.
* **A neurodivergência mascara o potencial:** As dificuldades executivas impedem que o alto potencial seja evidenciado em provas e testes padronizados.
* **O custo invisível:** A pessoa gasta uma quantidade descomunal de energia psíquica apenas para parecer funcional, levando frequentemente ao esgotamento e à sensação de que "algo está errado comigo".

#### Diferenças comuns entre Hiperfoco e Falta de Atenção:
* **No TDAH:** A desatenção não é falta de foco, mas sim uma desregulação da dopamina. Em tarefas de alto interesse estimulante, o cérebro entra em hiperfoco profundo.
* **Na Superdotação:** O foco profundo nasce da paixão pelo aprendizado e pelo desafio intelectual; a desatenção só ocorre quando o ambiente é repetitivo ou entediante.

🎯 **Acolhimento no Kite:** Aqui no Kite você não precisa escolher entre ser genial ou ter dificuldades executivas: ambas as realidades coexistem!`;
    }

    // 3. Burnout e Tédio Crônico
    if (q.includes('burnout') || q.includes('tédio') || q.includes('cansad') || q.includes('exaust') || q.includes('impostor')) {
      return `### 🛡️ Burnout e Síndrome do Impostor em Mentes com Altas Habilidades

O burnout na superdotação possui particularidades que muitas vezes os manuais convencionais não abordam:

#### Causas Típicas do Burnout em AH/SD:
1. **Tédio Existencial (Boredom Burnout):** Ficar muito tempo executando tarefas repetitivas ou burocráticas sem nenhum desafio cognitivo drena o cérebro dotado mais rápido do que o excesso de trabalho.
2. **Mascaramento Contínuo (Camouflaging):** Ajustar o vocabulário, conter a velocidade de raciocínio e tentar parecer "menos intenso" para ser aceito socialmente.
3. **Perfeccionismo Paralelo:** Expectativas desmedidas geradas pelo próprio indivíduo ou pelo rótulo de "promessa" colocado por terceiros.

#### Como Restaurar a Energia:
* **Crie "Santuários de Hiperfoco":** Reserve momentos protegidos na semana para pesquisar e criar o que realmente te entusiasma, sem cobrança de produtividade financeira.
* **Higiene Sensorial:** Use fones com cancelamento de ruído, diminua a intensidade das luzes e pratique o descanso passivo (sem telas).
* **Desconstrua a Síndrome do Impostor:** O fato de algo ser fácil para você não significa que não tem valor. Sua velocidade mental é apenas seu ponto de partida.`;
    }

    // 4. Testes, Laudo e Adultos
    if (q.includes('diagnost') || q.includes('laudo') || q.includes('adult') || q.includes('teste') || q.includes('identifica')) {
      return `### 🔍 Identificação de Altas Habilidades / Superdotação na Fase Adulta

A descoberta tardia é uma jornada profunda de reconciliação com a própria história.

#### Como é feita a identificação profissional:
* **Avaliação Neuropsicológica:** Realizada por psicólogo ou neuropsicólogo especializado em neurodiversidade e altas habilidades.
* **Baterias de Testes Cognitivos:** Aplicação de escalas reconhecidas (como WAIS-IV para inteligência geral, memória de trabalho e velocidade de processamento).
* **Análise Qualitativa e História de Vida:** Análise de histórico escolar, infância, criatividade, interesses apaixonados, sobre-excitabilidades e traços comportamentais.
* **Investigação de Comorbidades/2e:** Avaliação cuidadosa para distinguir se há TDAH, TEA, ansiedade ou apenas traços de intensidades da superdotação.

#### Por onde começar se você suspeita que tem AH/SD:
1. Leia sobre o assunto (autores como *Linda Silverman*, *Joseph Renzulli*, *Kazimierz Dabrowski* e *Guilherme de Almeida* no Brasil).
2. Participe de comunidades acolhedoras (como o **Kite**).
3. Busque profissionais que compreendam a abordagem afirmativa da neurodiversidade, evitando avaliadores que associam superdotação apenas a notas escolares.`;
    }

    // 5. Hiperfoco e Rotina
    if (q.includes('hiperfoco') || q.includes('rotina') || q.includes('procrastina')) {
      return `### ⚡ Gerenciando Hiperfoco e Dificuldades Executivas

O hiperfoco é uma superpotência quando canalizado, mas pode trazer desafios com alimentação, sono e tarefas do dia a dia.

#### Estratégias Funcionais:
* **Transições Suaves:** Coloque alarmes graduais antes do término do seu bloco de foco (ex: um aviso 10 minutos antes para preparar o cérebro para a troca de contexto).
* **Use Nossa Aba de Foco & Sentidos:** Experimente sons com frequências gama (40Hz) ou ruído suave para manter o estado de fluxo sem sobrecarga auditiva.
* **Caderno de Despejo Mental (Brain Dump):** Quando uma ideia genial surgir enquanto você estiver trabalhando em outra coisa, anote-a imediatamente em uma folha ao lado. Isso tranquiliza a mente de que nada será esquecido.
* **Autocompaixão:** Aceite que seu cérebro opera em ondas de alta intensidade seguidas de períodos de restauração, e não em uma linha reta homogênea.`;
    }

    // Default intelligent response for any other neurodivergence question
    return `### 🪁 Resposta Personalizada Kite IA

Obrigado por trazer essa reflexão sobre **"${query}"**! Na perspectiva da neurodiversidade e das altas habilidades, cada mente possui um perfil cognitivo e sensorial único:

#### 1. Perspectiva Cognitiva & Neuroafirmativa:
* No espectro neurodivergente, o funcionamento cerebral muitas vezes prioriza conexões não lineares, pensamento sistêmico e processamento profundo de padrões.
* O que o senso comum por vezes rotula como "dificuldade" ou "excesso" frequentemente reflete uma inadequação do ambiente externo às necessidades do seu sistema nervoso.

#### 2. Dicas & Práticas para o seu Cotidiano:
* **Respeite seu ritmo circadiano mental:** Nem todo dia será de hiperprodutividade, e o descanso cognitivo é parte ativa da consolidação do conhecimento.
* **Ajuste o ambiente sensorial:** Verifique se ruídos, luzes ou estímulos paralelos não estão drenando sua energia antes que você perceba.
* **Compartilhe com seus pares:** Leve essa pergunta para um dos nossos canais de chat comunitário (ex: *#comunidade-geral* ou *#sobre-excitabilidade*). Conversar com quem vive realidades semelhantes costuma trazer insights valiosos!

Se quiser aprofundar em algum ponto específico (como 2e, Dabrowski, estratégias executivas ou identificação), basta me perguntar! 💜`;
  }

  formatMarkdown(text) {
    let html = text
      .replace(/^### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^## (.*$)/gim, '<h4>$1</h4>')
      .replace(/^# (.*$)/gim, '<h4>$1</h4>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '<p></p>')
      .replace(/\n/g, '<br>');

    // Wrap list items in <ul>
    if (html.includes('<li>')) {
      html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
    }
    return html;
  }

  scrollToBottom() {
    if (this.chatFeed) {
      this.chatFeed.scrollTop = this.chatFeed.scrollHeight;
    }
  }
}

window.AiController = AiController;
