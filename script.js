
// Configurações básicas do projeto
const CONFIG = {
  goalBRL: 500000, // meta total em R$
  raisedBRL: 0,    // valor inicial visível (pode vir de backend)
  donationLinks: {
    // Substitua pelos links reais do provedor (Mercado Pago, Stripe, Asaas, PagSeguro etc.)
    cartao: "https://pagamento.exemplo/cartao", 
    boleto: "https://pagamento.exemplo/boleto",
    pixPayload: "00020126360014BR.GOV.BCB.PIX0114+5585999999995204000053039865406100.005802BR5920MBL CEARA CE SAUDE6009SABOEIRO62070503***6304ABCD" // exemplo fictício
  },
  transparencyCSV: "" // URL CSV/TSV publicado com prestações de contas (opcional)
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

// Abre e fecha modal de doação
const dlg = document.getElementById('dlgDoacao');
function openDonate() { if (dlg) dlg.showModal(); }
function closeDonate() { if (dlg) dlg.close(); }
window.openDonate = openDonate;
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

// Carrega transparência (opcional: CSV publicado com cabeçalhos: data,descricao,valor,tipo)
async function loadTransparency() {
  if (!CONFIG.transparencyCSV) return;
  try {
    const res = await fetch(CONFIG.transparencyCSV);
    const text = await res.text();
    const rows = text.split(/\r?\n/).filter(Boolean).map(l => l.split(','));
    const [header, ...data] = rows;
    const tbody = document.querySelector('#tb-transp tbody');
    if (!tbody) return;
    data.forEach(cols => {
      const tr = document.createElement('tr');
      cols.forEach(c => {
        const td = document.createElement('td');
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.warn('Falha ao carregar transparência', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  loadTransparency();
});
