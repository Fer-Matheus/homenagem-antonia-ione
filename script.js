
// Configurações básicas do projeto
const CONFIG = {
  goalBRL: 5000, // meta total em R$
  raisedBRL: 0,    // valor inicial visível (pode vir de backend)
  
  donorsSheetURL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTmj8Z_LPo_zVhHg_r6-zAk6zR-ZdZczCg5BS28JyyTlkblIEiW08eneedoicK7sR_8SfVcCz91NNu/pub?gid=2100924104&single=true&output=csv", // Cole aqui a URL da planilha publicada como CSV
  donationFormURL: "" // Cole aqui a URL do Google Forms para doação
};

// Formata número BRL
const fmtBRL = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Atualiza indicadores
function updateProgress() {
  // Permite sobrepor via localStorage (para testes de demo)
  const override = Number(localStorage.getItem('raisedBRL') || NaN);
  const raised = Number.isFinite(override) ? override : CONFIG.raisedBRL;

  const pct = Math.min(100, Math.round((raised / CONFIG.goalBRL) * 100));
  document.querySelectorAll('[data-raised]').forEach(el => el.textContent = fmtBRL(raised));
  document.querySelectorAll('[data-goal]').forEach(el => el.textContent = fmtBRL(CONFIG.goalBRL));
  document.querySelectorAll('[data-pct]').forEach(el => el.textContent = pct + '%');
  const bar = document.querySelector('.progress .bar');
  if (bar) bar.style.width = pct + '%';
}

// Abre e fecha modal de aviso para doação
const dlgAviso = document.getElementById('dlgAvisoDoacao');
function openDonate() {
  if (dlgAviso) dlgAviso.showModal();
}
function closeAvisoDoacao() {
  if (dlgAviso) dlgAviso.close();
}
function confirmarDoacao() {
  if (!CONFIG.donationFormURL) {
    alert('O link do formulário de doação ainda não foi configurado. Configure em script.js (CONFIG.donationFormURL)');
    return;
  }
  window.open(CONFIG.donationFormURL, '_blank', 'noopener');
  closeAvisoDoacao();
}
window.openDonate = openDonate;
window.closeAvisoDoacao = closeAvisoDoacao;
window.confirmarDoacao = confirmarDoacao;

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
