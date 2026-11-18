# FireWatch

Monitoramento e denúncia de focos de queimadas — PUC Minas, TI1.

- `public/` — front-end (HTML/CSS/JS puro).
- `server/` — API em Express (login com JWT, senhas com bcrypt, permissões) que também serve o `public/`.

## Rodar localmente

Requer Node.js 20.6 ou mais novo.

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:3000. Na primeira execução, `server/data/db.json` é criado a partir de `server/db.seed.json`.
Esse arquivo de dados **não vai para o git**.

Usuários de demonstração do seed: `admin` / `Admin@123` (administrador), `orgao` / `Orgao@123` (órgão aprovado), `civil` / `Civil@123`.

Variáveis de ambiente: veja `.env.example` (copie para `.env`).

## Perfis

- **civil**: cria denúncias, vê o próprio histórico, usa o fórum.
- **orgao**: entra como *pendente*; depois de aprovado por um administrador, gerencia o status das denúncias.
- **admin**: aprova/recusa órgãos e pode apagar qualquer conteúdo do fórum.

## Deploy no Render

- Root Directory: *(vazio — raiz do repositório)*
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: `NODE_ENV=production`, `JWT_SECRET=<valor longo e aleatório>`, `ADMIN_SENHA=<senha forte>`

O disco do plano gratuito do Render é apagado a cada deploy/reinício, então os dados voltam ao seed.
Para guardar dados de verdade, use um disco persistente (`DB_PATH`) ou um banco de dados.
