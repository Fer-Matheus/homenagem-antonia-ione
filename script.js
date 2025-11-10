
// Configurações básicas do projeto
const CONFIG = {
  goalBRL: 5000, // meta total em R$
  raisedBRL: 0,    // valor inicial visível (pode vir de backend)
  
  donorsSheetURL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTmj8Z_LPo_zVhHg_r6-zAk6zR-ZdZczCg5BS28JyyTlkblIEiW08eneedoicK7sR_8SfVcCz91NNu/pub?output=csv", // Cole aqui a URL da planilha publicada como CSV
  donationFormURL: "https://forms.gle/Ss5U3cJvcvR6Qj1dA", // Cole aqui a URL do Google Forms para doação

  // Chave PIX para doações
  pixKey: "apoio.mblceara@gmail.com", // Substitua pela chave PIX real extraída do QR Code

  // ID da planilha do Google Sheets (extraído da URL da planilha)
  // Exemplo de URL: https://docs.google.com/spreadsheets/d/1ABC123/edit
  // O ID seria: 1ABC123
  spreadsheetId: "1qNUsDI-w2bJdKGRwAsatmZD9w9B_Pqsf81Htj64rN9A",

  // Nome da aba que contém o montante (valor total das doações)
  amountSheetName: "Montante",

  // Célula que contém o valor total (ex: "A1", "B2", etc)
  amountCell: "A1"
};

// Formata número BRL
const fmtBRL = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Carrega o montante total das doações da planilha
async function loadTotalAmount() {
  if (!CONFIG.spreadsheetId || !CONFIG.amountSheetName || !CONFIG.amountCell) {
    console.log('Configuração da planilha de montante incompleta');
    return CONFIG.raisedBRL;
  }

  try {
    // Monta a URL da célula usando a API pública do Google Sheets
    const url = `https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.amountSheetName)}&range=${CONFIG.amountCell}`;

    console.log('Carregando montante de:', url);
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const text = await res.text();

    // A resposta vem como JSONP, precisamos extrair o JSON
    // Formato: google.visualization.Query.setResponse({...});
    const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
    if (!jsonMatch) {
      throw new Error('Formato de resposta inválido');
    }

    const data = JSON.parse(jsonMatch[1]);
    console.log('Dados recebidos completos:', data);

    // Extrai o valor da primeira célula
    if (data.table && data.table.rows && data.table.rows.length > 0) {
      const cell = data.table.rows[0].c[0];
      console.log('Célula encontrada:', cell);

      if (cell && cell.v !== null && cell.v !== undefined) {
        let value = cell.v;
        console.log('Valor bruto da célula:', value, 'Tipo:', typeof value);

        // Se for string, tenta fazer o parse
        if (typeof value === 'string') {
          // Remove R$, espaços, e converte vírgula em ponto
          value = parseFloat(value.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
        }

        value = Number(value);
        console.log('Valor após conversão:', value);

        if (Number.isFinite(value) && value >= 0) {
          console.log('✅ Montante encontrado:', value);
          return value;
        } else {
          console.warn('❌ Valor não é um número válido:', value);
        }
      } else {
        console.warn('❌ Célula vazia ou nula');
      }
    } else {
      console.warn('❌ Estrutura de dados inválida');
    }

    console.warn('⚠️ Retornando valor padrão:', CONFIG.raisedBRL);
    return CONFIG.raisedBRL;

  } catch (e) {
    console.error('Erro ao carregar montante:', e);
    return CONFIG.raisedBRL;
  }
}

// Atualiza indicadores
async function updateProgress() {
  console.log('🔄 Iniciando atualização de progresso...');

  // Tenta carregar o valor da planilha primeiro
  let raised = await loadTotalAmount();
  console.log('💰 Valor carregado:', raised);

  // Permite sobrepor via localStorage (para testes de demo)
  const override = Number(localStorage.getItem('raisedBRL') || NaN);
  if (Number.isFinite(override)) {
    console.log('⚠️ Usando override do localStorage:', override);
    raised = override;
  }

  const pct = Math.min(100, Math.round((raised / CONFIG.goalBRL) * 100));
  console.log('📊 Cálculo:', `${raised} / ${CONFIG.goalBRL} = ${pct}%`);

  document.querySelectorAll('[data-raised]').forEach(el => {
    el.textContent = fmtBRL(raised);
    console.log('✅ Atualizado [data-raised]:', fmtBRL(raised));
  });

  document.querySelectorAll('[data-goal]').forEach(el => {
    el.textContent = fmtBRL(CONFIG.goalBRL);
    console.log('✅ Atualizado [data-goal]:', fmtBRL(CONFIG.goalBRL));
  });

  document.querySelectorAll('[data-pct]').forEach(el => {
    el.textContent = pct + '%';
    console.log('✅ Atualizado [data-pct]:', pct + '%');
  });

  const bar = document.querySelector('.progress .bar');
  if (bar) {
    bar.style.width = pct + '%';
    console.log('✅ Atualizado barra de progresso:', pct + '%');
  }

  console.log('✅ Atualização completa!');
}

// Abre e fecha modal de aviso para doação
const dlgAviso = document.getElementById('dlgAvisoDoacao');
let selectedTierType = null;

function openDonate() {
  if (dlgAviso) {
    // Reset selection
    selectedTierType = null;
    document.querySelectorAll('.tier').forEach(tier => tier.classList.remove('selected'));
    dlgAviso.showModal();
  }
}

function closeAvisoDoacao() {
  if (dlgAviso) dlgAviso.close();
}

function selectTier(tierType) {
  selectedTierType = tierType;

  // Remove seleção anterior
  document.querySelectorAll('.tier').forEach(tier => {
    tier.classList.remove('selected');
  });

  // Adiciona seleção ao tier clicado
  const selectedTier = document.querySelector(`.tier[data-tier="${tierType}"]`);
  if (selectedTier) {
    selectedTier.classList.add('selected');
  }
}

function confirmarDoacao() {
  if (!CONFIG.donationFormURL) {
    alert('O link do formulário de doação ainda não foi configurado. Configure em script.js (CONFIG.donationFormURL)');
    return;
  }

  // Abre o formulário de doação
  // Você pode adicionar parâmetros à URL se o Google Forms aceitar pré-preenchimento
  let url = CONFIG.donationFormURL;

  // Opcional: adicionar informação da faixa selecionada como parâmetro
  if (selectedTierType) {
    const tierNames = {
      'symbolic': 'Doação Simbólica (R$ 0-499)',
      'reward1': 'Doação com Recompensa 1 (R$ 500-999)',
      'reward2': 'Doação com Recompensa 2 (R$ 1.000+)'
    };
    // Se o Google Forms tiver um campo pré-preenchível, você pode adicionar aqui
    // url += `&entry.XXXXX=${encodeURIComponent(tierNames[selectedTierType])}`;
  }

  window.open(url, '_blank', 'noopener');
}

// Copia a chave PIX para a área de transferência
async function copyPixKey() {
  if (!CONFIG.pixKey) {
    alert('A chave PIX ainda não foi configurada. Configure em script.js (CONFIG.pixKey)');
    return;
  }

  try {
    await navigator.clipboard.writeText(CONFIG.pixKey);
    alert('✅ Chave PIX copiada!\n\nCole no seu aplicativo bancário para fazer a doação.');
  } catch (err) {
    // Fallback para navegadores que não suportam clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = CONFIG.pixKey;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert('✅ Chave PIX copiada!\n\nCole no seu aplicativo bancário para fazer a doação.');
    } catch (err2) {
      alert('❌ Não foi possível copiar automaticamente.\n\nChave PIX: ' + CONFIG.pixKey);
    }
    document.body.removeChild(textarea);
  }
}

// Mostra instruções de como doar via PIX
function openPixInstructions() {
  const instructions = `
📱 Como fazer sua doação via PIX:

1️⃣ Abra o aplicativo do seu banco
2️⃣ Acesse a área de PIX
3️⃣ Escolha "Pagar com QR Code" ou "PIX Copia e Cola"
4️⃣ Escaneie o QR Code ou cole a chave copiada
5️⃣ Confirme o valor que deseja doar
6️⃣ Após o pagamento, preencha o formulário de confirmação

💡 Dica: Você pode escolher qualquer valor dentro das faixas apresentadas!
  `.trim();
  
  alert(instructions);
}

window.openDonate = openDonate;
window.closeAvisoDoacao = closeAvisoDoacao;
window.confirmarDoacao = confirmarDoacao;
window.selectTier = selectTier;
window.copyPixKey = copyPixKey;
window.openPixInstructions = openPixInstructions;

// Modal antigo de doação (mantido para referência, pode ser removido depois)
const dlg = document.getElementById('dlgDoacao');
function closeDonate() { if (dlg) dlg.close(); }
window.closeDonate = closeDonate;

// Abre e fecha modal de imagem
function openImageModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Previne scroll do body
  }
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restaura scroll do body
  }
}

window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

// Seleção de valores
let selectedAmount = 50;
function selectAmount(v) {
  selectedAmount = v;
  document.querySelectorAll('.amounts button').forEach(b => b.classList.toggle('active', Number(b.dataset.v) === v));
  const val = document.getElementById('valLivre');
  if (val && v === -1) val.focus();
}
window.selectAmount = selectAmount;

// Copiar payload PIX
async function copyPix() {
  const payload = CONFIG.donationLinks.pixPayload;
  try {
    await navigator.clipboard.writeText(payload);
    alert('Código PIX copiado! Cole no seu app para pagar.');
  } catch {
    alert('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
  }
}
window.copyPix = copyPix;

// Pagar por cartão/boleto via links prontos (pagamento seguro fora do site)
function payBy(linkKey) {
  // Aqui também é possível anexar ?amount= ao link se o provedor aceitar
  const v = selectedAmount === -1 ? Number(document.getElementById('valLivre').value || 0) : selectedAmount;
  const link = CONFIG.donationLinks[linkKey];
  if (!link) return alert('Link de pagamento não configurado.');
  const final = /\?/.test(link) ? link + '&amount=' + v : link + '?amount=' + v;
  window.open(final, '_blank', 'noopener');
}
window.payBy = payBy;

// Carrega doadores da planilha do Google Sheets
async function loadDonors() {
  const container = document.getElementById('donors-container');
  const listDiv = document.getElementById('donors-list');
  const namesList = document.getElementById('donors-names-list');

  if (!CONFIG.donorsSheetURL) {
    container.innerHTML = '<p class="small-note" style="text-align: center; padding: 20px;">Configure a URL da planilha de doadores no arquivo script.js (CONFIG.donorsSheetURL)</p>';
    return;
  }

  try {
    console.log('Carregando doadores de:', CONFIG.donorsSheetURL);
    const res = await fetch(CONFIG.donorsSheetURL);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const text = await res.text();
    console.log('Dados recebidos:', text.substring(0, 200));

    const rows = text.split(/\r?\n/).filter(line => line.trim() !== '');
    console.log('Total de linhas:', rows.length);

    // Remove o cabeçalho (primeira linha - A1)
    const [header, ...data] = rows;
    console.log('Cabeçalho:', header);
    console.log('Dados (sem cabeçalho):', data.length, 'linhas');

    if (data.length === 0) {
      container.innerHTML = '<p class="small-note" style="text-align: center; padding: 20px;">Ainda não há doadores registrados.</p>';
      return;
    }

    // Limpa a lista
    namesList.innerHTML = '';

    // Adiciona cada doador (pega apenas o primeiro campo = nome, a partir de A2)
    let count = 0;
    data.forEach((row, index) => {
      if (!row.trim()) return; // Pula linhas vazias

      // Remove aspas e pega o primeiro campo
      let nome = row.trim();

      // Se tiver aspas no início, extrai o conteúdo até a próxima aspa
      if (nome.startsWith('"')) {
        const match = nome.match(/^"([^"]*)"/);
        nome = match ? match[1] : nome.replace(/^"/, '').split(',')[0];
      } else {
        // Sem aspas, pega até a primeira vírgula
        nome = nome.split(',')[0];
      }

      nome = nome.trim();

      if (nome && nome !== '') {
        const li = document.createElement('li');
        li.textContent = nome;
        namesList.appendChild(li);
        count++;
        console.log(`Doador ${count}:`, nome);
      }
    });

    console.log('Total de doadores carregados:', count);

    if (count === 0) {
      container.innerHTML = '<p class="small-note" style="text-align: center; padding: 20px;">Nenhum nome encontrado na planilha.</p>';
      return;
    }

    // Mostra a lista e esconde o container de loading
    container.style.display = 'none';
    listDiv.style.display = 'block';

  } catch (e) {
    console.error('Erro ao carregar doadores:', e);
    container.innerHTML = `<p class="small-note" style="text-align: center; padding: 20px; color: var(--danger);">Erro ao carregar lista de doadores: ${e.message}<br><br>Verifique se a planilha está pública e se a URL está correta.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  loadDonors();
});

// Carrossel de Notícias
let currentNewsIndex = 0;

function showNews(index) {
  const items = document.querySelectorAll('.news-item');
  const dots = document.querySelectorAll('.dot');

  if (index >= items.length) currentNewsIndex = 0;
  if (index < 0) currentNewsIndex = items.length - 1;

  items.forEach((item, i) => {
    item.classList.remove('active');
    if (i === currentNewsIndex) {
      item.classList.add('active');
    }
  });

  dots.forEach((dot, i) => {
    dot.classList.remove('active');
    if (i === currentNewsIndex) {
      dot.classList.add('active');
    }
  });
}

function changeNews(direction) {
  currentNewsIndex += direction;
  showNews(currentNewsIndex);
}

function currentNews(index) {
  currentNewsIndex = index;
  showNews(currentNewsIndex);
}

window.changeNews = changeNews;
window.currentNews = currentNews;

// Auto-avançar o carrossel a cada 8 segundos
setInterval(() => {
  changeNews(1);
}, 8000);
