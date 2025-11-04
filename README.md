
# Site de Arrecadação — Monumento a Antônia Ione (MBL CE)

Este repositório contém um **site estático** pronto para publicar (Vercel, Cloudflare Pages, Netlify ou GitHub Pages).  
O fluxo de pagamento é feito **fora do site**, por links do seu provedor (ex.: Mercado Pago, PagSeguro, Stripe, Asaas), garantindo segurança e conformidade.

## Como usar

1. **Edite a meta e valores** no `script.js` (objeto `CONFIG`):
   - `goalBRL`: meta total em Reais.
   - `raisedBRL`: valor já arrecadado (se quiser exibir um número inicial). O ideal é ler de um backend.
2. **Configure os links de pagamento** no `script.js` → `CONFIG.donationLinks`.
   - `cartao` e `boleto`: substitua por **Payment Links** do seu provedor.
   - `pixPayload`: substitua pelo payload do seu QR PIX dinâmico (ou estático).  
     Gere pelo seu provedor para permitir **valor variável** (usar parâmetro `amount` no link de pagamento quando suportado).
3. **Substitua o QR** em `assets/pix-qr-placeholder.svg` por um QR real do seu provedor.
4. (Opcional) **Transparência automática**: publique uma planilha como CSV e coloque a URL em `CONFIG.transparencyCSV`.
5. (Opcional) Use `localStorage.setItem('raisedBRL', 12345)` no console do navegador para simular progresso.
6. **Publique**:
   - **GitHub Pages** (automático): faça push para o repositório e ative o GitHub Pages nas configurações.
   - Vercel: arraste a pasta para um novo projeto (framework "Other").  
   - Cloudflare Pages / Netlify: aponte a raiz para a pasta do projeto.
7. **Domínio**: configure DNS (ex.: `monumentoantonia.org.br`).

## GitHub Pages - Configuração

Este projeto já está configurado para deploy automático no GitHub Pages:

1. **Faça push do código** para o GitHub (branch `main` ou `master`)
2. **Ative o GitHub Pages**:
   - Vá em **Settings** → **Pages**
   - Em **Source**, selecione **GitHub Actions**
3. O workflow `.github/workflows/deploy.yml` fará o deploy automaticamente a cada push
4. Seu site estará disponível em: `https://<seu-usuario>.github.io/<nome-do-repo>/`

### Configurar domínio customizado (opcional)

1. Nas configurações do GitHub Pages, adicione seu domínio customizado
2. Configure os registros DNS do seu provedor:
   - Para domínio raiz (`monumentoantonia.org.br`):
     - Tipo `A` apontando para os IPs do GitHub:
       - `185.199.108.153`
       - `185.199.109.153`
       - `185.199.110.153`
       - `185.199.111.153`
   - Para subdomínio (`www.monumentoantonia.org.br`):
     - Tipo `CNAME` apontando para `<seu-usuario>.github.io`
3. Aguarde a propagação do DNS (pode levar até 48h)

## Boas práticas legais e de confiança

- **LGPD**: só colete dados necessários (e-mail para recibo); publique política de privacidade e meios de contato.  
- **Termos de doação**: explique finalidades, governança, reembolso (se houver) e auditoria.  
- **Transparência**: publique planilha mensal com entradas/saídas (data, descrição, valor, tipo, documento).  
- **Acessibilidade**: imagens com `alt`, contraste adequado, navegação por teclado (já contemplado).  
- **Segurança**: não exponha chaves API no frontend; prefira Payment Links do provedor ou backend serverless.

## Personalização rápida

- Troque cores em `:root` no `styles.css` (`--brand`, `--bg` etc.).
- Substitua `assets/logo.svg` e `assets/hero.svg` por artes oficiais.
- Ajuste textos em `index.html` (seções Sobre, Monumento, Transparência, FAQ, Contato).

## Extensões sugeridas (próximos passos)

- Modo **boletim**: seção de atualizações (notas de obra, fotos).  
- **i18n**: versão EN.  
- **Newsletter** via Buttondown/Sendgrid (apenas e-mail, com duplo opt-in).  
- **CMS estático** (Netlify CMS) para editar conteúdo sem mexer no código.
