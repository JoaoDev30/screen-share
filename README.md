# ScreenShare

Clone simples do "Compartilhar Tela" do Discord. Desktop (Electron + React + Vite + TypeScript)
com sinalização via Socket.IO e transmissão P2P por WebRTC.

Sem login, sem banco, sem criptografia. Feito para um grupo pequeno em rede de confiança.

## Requisitos

- Node.js 20+ (testado no 25)
- Windows / macOS / Linux

## Instalação

> **Atenção (Windows):** o PowerShell 5.1 — o padrão do Windows — **não aceita `&&`**.
> Rode `cd` e `npm` em linhas separadas, como abaixo. Para encadear numa linha só, use `;`.

Entre na pasta (uma vez só):

```
cd C:\Users\Desktop\screen-share-app
```

Instale tudo:

```
npm run install:all
```

## Rodando (servidor + cliente + Electron juntos)

```
npm run dev
```

Isso sobe:

| Processo | Porta | O que é |
| --- | --- | --- |
| server | 3001 | Express + Socket.IO (sinalização) |
| vite | 5173 | Dev server do React |
| electron | — | Janela do app apontando para o Vite |

Para parar tudo: `Ctrl + C` no terminal.

Rodar separado, se preferir (um terminal para cada):

```
npm run dev:server
```

```
npm run dev:client
```

## Problemas comuns

**`O token '&&' não é um separador de instruções válido nesta versão`**
É o PowerShell 5.1. Rode os comandos em linhas separadas, ou troque `&&` por `;`.

**`Port 5173 is already in use` / `EADDRINUSE :3001`**
Sobrou processo de uma execução anterior. Libere as portas:

```
npm run kill
```

**A primeira execução trava em `Downloading Electron binary...`**
Normal: ele baixa o binário do Electron (~235 MB) só na primeira vez. Deixe terminar.

## Publicando o servidor (faça isto primeiro)

O servidor de sinalização precisa ficar num endereço fixo, alcançável pela internet.
Assim a URL entra gravada no executável e seus amigos nunca configuram nada.

O vídeo **não** passa por esse servidor: ele só faz a apresentação inicial entre os
dois computadores. O tráfego pesado vai direto de um para o outro (P2P).

### 1. Suba o código para o GitHub

O repositório local já está iniciado, commitado e no branch `main`.

Crie o repositório em [github.com/new](https://github.com/new). Pode ser privado, mas
**deixe-o completamente vazio**: não marque "Add a README", nem `.gitignore`, nem
licença. Se o GitHub criar qualquer arquivo, o push é recusado com
`Updates were rejected because the remote contains work that you do not have locally`.

Depois aponte o remote (pule se já tiver feito — dá `remote origin already exists`):

```
git remote add origin https://github.com/SEU-USUARIO/screen-share-app.git
```

E envie:

```
git push -u origin main
```

Se aparecer uma janela do navegador pedindo login do GitHub, é o Git Credential
Manager. Autorize e o push continua sozinho.

**Erros comuns aqui:**

| Mensagem | O que houve |
| --- | --- |
| `src refspec main does not match any` | O branch local é `master`. Corrija com `git branch -M main`. |
| `Repository not found` | O repositório não existe no GitHub ainda, ou o nome está diferente. |
| `Updates were rejected` | O repositório foi criado com README. Use `git pull --rebase origin main` e envie de novo. |

### 2. Deploy no Render

1. Entre em [render.com](https://render.com) com a conta do GitHub (não pede cartão).
2. **New → Blueprint**, escolha o repositório.
3. O Render lê o `render.yaml` da raiz sozinho: build, start e health check já estão
   configurados. Clique em **Apply**.
4. Ao terminar, copie a URL gerada, algo como
   `https://screenshare-signaling.onrender.com`.

Teste abrindo `SUA-URL/health` no navegador. Deve responder:

```
{"ok":true,"uptime":12.3,"rooms":0,"participants":0}
```

### 3. Grave a URL no executável

Crie o arquivo `client/.env.production` (há um `.env.production.example` de modelo):

```
VITE_SERVER_URL=https://screenshare-signaling.onrender.com
```

Gere o executável:

```
npm --prefix client run dist
```

Sai em `client/release/ScreenShare-1.0.0-portable.exe`. A URL fica **dentro** do
binário — seus amigos só abrem e usam.

### Sobre o plano gratuito

O Render hiberna o serviço após ~15 minutos sem uso e leva até ~1 minuto para acordar.
Não é falha: o app mostra "Acordando o servidor…" nesse intervalo. A partir da segunda
conexão fica instantâneo. Para nunca hibernar, o plano pago do Render resolve, ou um
serviço externo pingando `/health` a cada 10 minutos.

## Mandando o app para os amigos

Mande apenas o `ScreenShare-1.0.0-portable.exe` (~90 MB). Não precisa instalar nada.

Na primeira abertura o Windows mostra "O Windows protegeu o computador", porque o
executável não é assinado. **Mais informações → Executar assim mesmo**.

Se você ainda não publicou o servidor, dá para usar na rede local: quem hospeda roda
`npm run dev:server`, libera a porta 3001 no firewall e passa o IP; os outros clicam no
link **Servidor: localhost:3001** na tela inicial e trocam pelo IP dele.

```
netsh advfirewall firewall add rule name="ScreenShare" dir=in action=allow protocol=TCP localport=3001
```

### Limites da versão atual

Esta build está na ETAPA 4. Ainda **não tem**:

- áudio (nem do sistema, nem microfone) — ETAPA 6
- miniaturas de várias transmissões ao mesmo tempo — ETAPA 5

Uma transmissão por vez funciona bem; se duas pessoas compartilharem, só a primeira
aparece no palco.

A transmissão é P2P direta e só há STUN configurado. Em algumas operadoras (NAT
simétrico, CGNAT) o P2P não fecha e seria preciso um servidor TURN, que este projeto
não tem.

## Estrutura

```
screen-share-app/
├── server/          # sinalização (Express + Socket.IO), estado em memória
│   └── src/{server,socket,rooms,types}.ts
├── client/
│   ├── electron/    # processo principal + preload
│   └── src/{pages,components,hooks,services,styles}
└── README.md
```

## Etapas

- [x] ETAPA 1 — estrutura, dependências, Electron + React + Vite + Express rodando juntos
- [x] ETAPA 2 — Socket.IO: criar/entrar/sair de sala, lista de participantes
- [x] ETAPA 3 — WebRTC: SDP, ICE, conexão P2P
- [x] ETAPA 4 — compartilhamento de tela (getDisplayMedia) e recepção do stream
- [ ] ETAPA 5 — interface: participantes, miniaturas, fullscreen, animações
- [ ] ETAPA 6 — áudio da tela + microfone, bitrate e FPS
