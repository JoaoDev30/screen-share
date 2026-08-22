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

## Mandando o app para os amigos

O executável portátil sai em `client/release/ScreenShare-1.0.0-portable.exe` (~90 MB).
Gerar de novo:

```
npm --prefix client run dist
```

### O ponto que não dá para pular

O `.exe` sozinho não funciona. Ele é só o cliente — **uma pessoa precisa hospedar o
servidor de sinalização** e as outras precisam alcançar esse endereço. Sem isso cada
cópia procura um servidor no próprio `localhost` e não acha nada.

### Quem hospeda (você)

1. Suba o servidor e deixe rodando:

```
npm run dev:server
```

2. Descubra seu IP na rede local:

```
ipconfig
```

Procure o "Endereço IPv4" (algo como `192.168.0.10`).

3. Libere a porta 3001 no Firewall do Windows:

```
netsh advfirewall firewall add rule name="ScreenShare" dir=in action=allow protocol=TCP localport=3001
```

### Quem só vai usar (seus amigos)

1. Abrir o `ScreenShare-1.0.0-portable.exe`.
   O Windows vai mostrar "O Windows protegeu o computador" — o app não é assinado.
   **Mais informações → Executar assim mesmo**.
2. Na tela inicial, clicar em **Servidor: localhost:3001** (embaixo do indicador).
3. Trocar pelo endereço de quem hospeda, ex.: `192.168.0.10:3001`, e salvar.
4. O indicador precisa ficar verde, "Servidor online". Aí é só nome + código.

### Se vocês não estiverem na mesma rede

O IP local (`192.168.x.x`) só vale dentro da mesma casa/rede. Pela internet, escolha um:

- **VPN de rede virtual** (Tailscale, ZeroTier, Radmin): mais simples e seguro. Todos
  entram na mesma rede virtual e usam o IP que a VPN der.
- **Encaminhamento de porta** no roteador de quem hospeda (porta 3001) + IP público.

Um aviso honesto: mesmo com o servidor acessível, a transmissão em si é P2P direta.
Hoje só há STUN configurado. Em algumas operadoras (NAT simétrico, CGNAT) o P2P não
fecha e seria preciso um servidor TURN, que não existe neste projeto.

### Limites da versão atual

Esta build está na ETAPA 4. Ainda **não tem**:

- áudio (nem do sistema, nem microfone) — ETAPA 6
- miniaturas de várias transmissões ao mesmo tempo — ETAPA 5

Uma transmissão por vez funciona bem; se duas pessoas compartilharem, só a primeira
aparece no palco.

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
