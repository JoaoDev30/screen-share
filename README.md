# ScreenShare

Clone simples do "Compartilhar Tela" do Discord. Desktop (Electron + React + Vite + TypeScript)
com sinalização via Socket.IO e transmissão P2P por WebRTC.

Sem login, sem banco, sem criptografia. Feito para um grupo pequeno em rede de confiança.

Tema escuro em azul royal: fundo navy quase preto, acento `#3d5afe` e
superfícies com gradiente suave. O verde ficou reservado para "ao vivo".
Todos os pares de texto e fundo passam WCAG AA (contraste mínimo de 4,5:1).

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
4. Ao terminar, copie a URL que aparece **no topo da página do serviço** no painel do
   Render. Atenção: se o nome `screenshare-signaling` já estiver em uso por outra
   pessoa, o Render gera um endereço diferente, com sufixo aleatório
   (`screenshare-signaling-a1b2.onrender.com`). Use sempre a URL do painel, nunca a
   do exemplo.

Teste abrindo `SUA-URL/health` no navegador. Deve responder:

```
{"ok":true,"uptime":12.3,"rooms":0,"participants":0}
```

### 3. Grave a URL no executável

Crie o arquivo `client/.env.production` (há um `.env.production.example` de modelo):

```
VITE_SERVER_URL=https://cole-aqui-sua-url.onrender.com
```

Gere o executável:

```
npm --prefix client run dist
```

Sai em `client/release/ScreenShare-1.1.0-portable.exe`. A URL fica **dentro** do
binário — seus amigos só abrem e usam.

### Sobre o plano gratuito

O Render hiberna o serviço após ~15 minutos sem uso e leva até ~1 minuto para acordar.
Não é falha: o app mostra "Acordando o servidor…" nesse intervalo. A partir da segunda
conexão fica instantâneo. Para nunca hibernar, o plano pago do Render resolve, ou um
serviço externo pingando `/health` a cada 10 minutos.

## Mandando o app para os amigos

Mande apenas o `ScreenShare-1.1.0-portable.exe` (~90 MB). Não precisa instalar nada.

Na primeira abertura o Windows mostra "O Windows protegeu o computador", porque o
executável não é assinado. **Mais informações → Executar assim mesmo**.

Se você ainda não publicou o servidor, dá para usar na rede local: quem hospeda roda
`npm run dev:server`, libera a porta 3001 no firewall e passa o IP; os outros clicam no
link **Servidor: localhost:3001** na tela inicial e trocam pelo IP dele.

```
netsh advfirewall firewall add rule name="ScreenShare" dir=in action=allow protocol=TCP localport=3001
```

## Como usar na sala

### Transmitir

**Compartilhar tela** abre o seletor com as telas, janelas e aplicativos disponíveis,
cada um com miniatura. **Parar** encerra. Fechar a captura pela barra do sistema
também para — o app percebe.

### Assistir com várias transmissões

Se mais de uma pessoa compartilhar, aparecem miniaturas abaixo do vídeo. Clicar troca
o vídeo principal. Quem está no palco é marcado em quatro lugares ao mesmo tempo:

| Onde | Marca |
| --- | --- |
| Lista de participantes | status "Assistindo esta" e um ▶ azul |
| Quem transmite mas não está no palco | "Transmitindo · clique para ver" |
| Miniatura | selo "▶ Assistindo" |
| Barra do vídeo | "Assistindo · **Nome** · 1 de N transmissões" |

**Tela cheia**: botão na barra do vídeo, ou duplo clique na imagem. `Esc` sai.

### Volume por pessoa

**Clique direito** no vídeo, numa miniatura ou num participante abre uma barra de
0 a 100, no estilo Discord, com botão de silenciar. O ajuste vale só para você e
alcança tanto o áudio da tela quanto o microfone daquela pessoa.

O volume dura só a sessão: a identidade aqui é o `socket.id`, que muda a cada
reconexão, então guardar não teria a quem aplicar depois.

### Áudio

- **Áudio da tela**: capturado junto com a imagem, via `loopback` do Electron. Se a
  fonte escolhida não fornecer áudio, o botão aparece indisponível. No Windows o
  loopback pega **todo** o som do computador, não só o da janela escolhida.
- **Microfone**: desligado por padrão. Ligar abre o microfone e envia; desligar
  **remove a trilha**, não apenas muta — mutando, o sistema operacional continuaria
  com o microfone aberto.
- A voz de cada um toca independentemente de quem está no vídeo principal, e as
  miniaturas são sempre mudas.

### Qualidade

Vídeo limitado a 2,5 Mbps e 30 FPS, com `degradationPreference: maintain-framerate`:
sob banda apertada o WebRTC derruba a resolução e segura os quadros, em vez de travar
a imagem.

Áudio em até 128 kbps, **em estéreo**. O Opus negocia mono por padrão no WebRTC, então
o SDP declara `stereo=1` e `sprop-stereo=1` — sem isso o som seria rebaixado no
caminho. O processamento de voz (eco, ruído, ganho automático) fica desligado no som
do sistema: serve para voz e estragaria música e jogo.

### Limite conhecido

A transmissão é P2P direta e só há STUN configurado. Em algumas operadoras (NAT
simétrico, CGNAT) o P2P não fecha e seria preciso um servidor TURN, que este projeto
não tem.

## Estrutura

```
screen-share-app/
├── server/               # sinalização (Express + Socket.IO), estado em memória
│   ├── src/
│   │   ├── server.ts     # HTTP + health check
│   │   ├── socket.ts     # salas, participantes e relay de SDP/ICE
│   │   ├── rooms.ts      # estado em memória, códigos de 6 caracteres
│   │   └── types.ts      # contratos compartilhados
│   └── Dockerfile
├── client/
│   ├── electron/         # processo principal (seletor de tela) + preload
│   └── src/
│       ├── pages/        # Home, Room
│       ├── components/   # VideoStage, BroadcastTile, ParticipantList,
│       │                 # SourcePicker, VolumeMenu, RemoteAudio, ...
│       ├── hooks/        # useRoom, usePeers, useScreenShare,
│       │                 # useMicrophone, useVolumes
│       ├── services/     # socket, webrtc (PeerManager), screen, config
│       └── styles/
├── render.yaml           # blueprint de deploy do servidor
└── README.md
```

## Etapas

- [x] ETAPA 1 — estrutura, dependências, Electron + React + Vite + Express rodando juntos
- [x] ETAPA 2 — Socket.IO: criar/entrar/sair de sala, lista de participantes
- [x] ETAPA 3 — WebRTC: SDP, ICE, conexão P2P
- [x] ETAPA 4 — compartilhamento de tela (getDisplayMedia) e recepção do stream
- [x] ETAPA 5 — interface: participantes, miniaturas, fullscreen, animações
- [x] ETAPA 6 — áudio da tela + microfone, bitrate e FPS
