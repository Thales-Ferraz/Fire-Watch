# Prompt — Melhorias do FireWatch

> Cole o texto abaixo numa sessão do Claude Code aberta na pasta `Fire-Watch`.
> Dá para pedir uma fase por vez ("faça só a Fase 1"), que é o recomendado.

---

Você vai trabalhar no projeto **FireWatch** (monitoramento e denúncia de queimadas — trabalho da PUC Minas).

## Contexto do projeto
- Tudo fica em `public/`: páginas HTML puras (`firewatch.html` é a SPA principal; `login.html`, `cadastro_pessoa.html`), fragmentos carregados via `fetch` + `innerHTML` (`dashboard.html`, `denuncia.html`, `catalogo.html`) e scripts em `public/assets/js/`.
- Backend atual: **json-server** servindo `public/db.json`, hospedado em `https://fire-watch.onrender.com` (plano grátis do Render, que "dorme" e demora para acordar). A URL está repetida em todos os JS.
- `express` e `cors` já estão no `package.json`, mas ainda não são usados.
- Perfis: `civil` (faz denúncias, usa o fórum) e `orgao` (também gerencia o status das denúncias).
- Mapa e busca de endereço com Mapbox GL / Search JS; gráfico com Chart.js via CDN.

## Regras de trabalho
- Vá **fase por fase, na ordem**. Ao terminar cada fase, pare, resuma o que mudou e como testar, e espere meu OK.
- Não quebre os fluxos: cadastro → login → nova denúncia → mapa/dashboard → histórico → fórum → gerenciar (órgão).
- Mantenha HTML/CSS/JS puros (sem framework), a menos que eu peça. Código e mensagens em português.
- Não faça commit nem push sem eu pedir.

## Fase 1 — Segurança e dados (CRÍTICO)
1. **Criar um backend próprio em Express** (`server/`) no lugar do json-server puro (pode continuar persistindo num JSON, ou usar SQLite). Hoje qualquer pessoa consegue fazer `GET /usuarios` e ver **todas as senhas**, e também `DELETE`/`PATCH` em qualquer registro.
2. **Senhas**: guardar com hash (`bcrypt`), nunca devolver o campo `senha` na API. Fazer login por `POST /auth/login`. Hoje a senha vai na **query string** (`?login=...&senha=...`), o que expõe a senha em logs e no histórico do navegador.
3. **Autenticação/autorização no servidor** (JWT ou sessão): só o dono pode excluir a própria denúncia; só `orgao` pode mudar o status; só o autor pode apagar tópicos e posts (hoje isso é checado pelo **nome**, no front). Não guardar o objeto do usuário com a senha no `sessionStorage`.
4. **Cadastro de órgão**: hoje qualquer pessoa se cadastra como `orgao` já com `status: "aprovado"`. Órgão deve entrar como `pendente` até um admin aprovar.
5. **XSS**: todo conteúdo vindo do usuário (título/descrição/posts/comentários do fórum, local e descrição da denúncia, popup do mapa com `setHTML`) é inserido com `innerHTML` sem escapar. Criar um `escapeHTML()` e usar `textContent` onde der.
6. **Repositório**: criar `.gitignore` (`node_modules/`, `.env`); tirar `node_modules` (1.700+ arquivos) e `db.json` com dados reais do versionamento; criar um `db.seed.json` só com dados fictícios. Centralizar o token do Mapbox num só lugar (hoje está em 3 arquivos) e me lembrar de restringir o token por URL no painel do Mapbox.

## Fase 2 — Bugs funcionais (ALTO)
1. **Status inconsistente**: `"Em Verificação"` (salvo) vs `"Em verificação"` (nos mapas de cor de `gerencia.js` e `historico.js`) — a cor nunca bate. Criar constantes únicas para status e gravidade.
2. **Dashboard carregando em dobro**: `mapa.js` e `dashboard.js` rodam no `DOMContentLoaded` → o mapa é criado 2x e `/denuncias` é buscado 3–4x. Fazer um único ponto de entrada e buscar as denúncias uma vez só.
3. **Dados falsos fixos**: o alerta "3 focos críticos em MG" e as "Ocorrências recentes" estão escritos à mão no HTML; o card "Regiões afetadas" (em `firewatch.html`) vira "Focos do dia" (em `dashboard.html`). Calcular tudo a partir dos dados reais.
4. **Data de "hoje"** usa `toISOString()` (UTC): depois das 21h no Brasil conta o dia errado. Usar data local.
5. `d.status.trim()` quebra se `status` vier vazio; tratar campos ausentes.
6. **Fórum**: cada post/comentário reescreve o array `posts` inteiro do tópico (dois usuários ao mesmo tempo = um apaga o post do outro). Criar endpoints próprios para posts/comentários. Não deixar "Visitante" postar.
7. **Denúncia**: a foto em base64 vai dentro do JSON (o banco incha e a listagem baixa todas as fotos). Salvar o arquivo (upload) e guardar só a URL. Validar a data (não aceitar data futura), não usar `window.location.reload()` após enviar, e não adicionar um listener de clique novo no modal toda vez que ele abre.
8. **"Painel do Órgão"** no menu não faz nada — implementar ou remover. Proteger "Gerenciar Denúncias" também no servidor.
9. **Chart.js** carregado sem versão fixa (`cdn.jsdelivr.net/npm/chart.js`) — fixar a versão e destruir o gráfico antigo ao reabrir o dashboard.

## Fase 3 — Qualidade do frontend (MÉDIO)
1. **Estilos inline** em quase todo o JS (`forum.js`, `gerencia.js`, `historico.js`, `catalogo.js`) com `onmouseover`/`onmouseout`. Passar para classes no CSS com `:hover`/`:focus`, e as cores para variáveis CSS (`:root { --fire: #ff5c1a; ... }`).
2. **Código duplicado**: o card de denúncia é praticamente igual em `historico.js` e `gerencia.js`; a URL da API está em todos os arquivos. Criar `assets/js/config.js` (URL da API, token) e `assets/js/api.js` (fetch com tratamento de erro).
3. **Responsividade**: não existe nenhum `@media`. A sidebar fixa de 220px + `height: 100vh` quebra no celular — fazer menu recolhível e grid adaptável.
4. **Navegação**: a SPA não muda a URL, então F5 sempre volta pro dashboard e o botão "voltar" sai do site. Usar rotas por hash (`#/historico`, `#/forum`, ...).
5. **Feedback**: trocar `alert`/`confirm` por toasts e por um modal de confirmação; mostrar loading/skeleton (o Render demora para acordar) e desabilitar o botão durante o envio.
6. **Acessibilidade**: o modal precisa fechar com Esc e manter o foco dentro dele; labels com `for` no formulário de denúncia; `aria-label` em botões que só têm ícone; contraste dos textos `#45494d` sobre fundo escuro.
7. Filtros/busca no histórico e no gerenciar (por status, gravidade, data), com paginação.

## Fase 4 — Estrutura e entrega (BAIXO)
1. Mover `package.json` para a raiz, corrigir o `description` (está com o markdown do README dentro) e o `main`; criar scripts `dev` e `start`.
2. README com como rodar localmente, variáveis de ambiente e usuários de teste.
3. ESLint + Prettier; corrigir o nome `catalago.css` → `catalogo.css`.
4. Testes básicos da API (login, permissões, CRUD de denúncia).

Comece pela **Fase 1**: primeiro me mostre o plano (arquivos que vai criar/alterar e como o front vai consumir a nova API), depois implemente.
