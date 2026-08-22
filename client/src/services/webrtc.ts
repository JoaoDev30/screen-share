import { socket } from './socket';
import type { IncomingSignal, PeerState } from './types';

/**
 * STUN público como rede de segurança. Em LAN os candidatos host já resolvem
 * (mais rápido); o STUN só entra em cena se os amigos não estiverem na mesma rede.
 */
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

interface Peer {
  id: string;
  pc: RTCPeerConnection;
  channel: RTCDataChannel | null;
  /**
   * Perfect negotiation: em uma colisão de offers, o educado cede e o
   * mal-educado ignora. A regra precisa dar resultados opostos nos dois lados.
   */
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  /** Senders das tracks locais, para conseguir remover ao parar. */
  senders: RTCRtpSender[];
}

type StateListener = (peerId: string, state: PeerState) => void;
type RemoteStreamListener = (peerId: string, stream: MediaStream | null) => void;

export class PeerManager {
  private peers = new Map<string, Peer>();
  private selfId = '';
  private listener: StateListener = () => {};
  /** Stream que estou transmitindo agora (null quando não transmito). */
  private localStream: MediaStream | null = null;
  private onRemoteStream: RemoteStreamListener = () => {};

  start(
    selfId: string,
    onStateChange: StateListener,
    onRemoteStream: RemoteStreamListener
  ): void {
    this.selfId = selfId;
    this.listener = onStateChange;
    this.onRemoteStream = onRemoteStream;
    socket.on('webrtc:signal', this.handleSignal);
  }

  stop(): void {
    socket.off('webrtc:signal', this.handleSignal);
    this.localStream = null;
    for (const id of [...this.peers.keys()]) this.disconnect(id);
  }

  /**
   * Começa a transmitir: adiciona as tracks em todos os peers. O
   * onnegotiationneeded dispara sozinho e o perfect negotiation cuida da offer.
   */
  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    for (const peer of this.peers.values()) {
      // Peer no meio de uma negociacao pega a track quando voltar a 'stable'.
      if (peer.pc.signalingState === 'stable') this.attachLocalStream(peer);
    }
  }

  /** Para de transmitir: remove as tracks e deixa a renegociação acontecer. */
  clearLocalStream(): void {
    this.localStream = null;
    for (const peer of this.peers.values()) {
      for (const sender of peer.senders) {
        try {
          peer.pc.removeTrack(sender);
        } catch (err) {
          console.error('[webrtc] falha ao remover track', err);
        }
      }
      peer.senders = [];
    }
  }

  /**
   * Anexa a midia local ao peer. So roda com a sinalizacao estavel: adicionar
   * track no meio de uma negociacao fabrica colisao de offers, e o lado
   * impolite descarta a offer perdida sem que nada tente de novo.
   */
  private attachLocalStream(peer: Peer): void {
    if (!this.localStream || peer.senders.length > 0) return;
    if (peer.pc.signalingState !== 'stable') return;
    for (const track of this.localStream.getTracks()) {
      peer.senders.push(peer.pc.addTrack(track, this.localStream));
    }
  }

  /** Inicia a conexão com um peer. Quem chega na sala chama para cada veterano. */
  connect(peerId: string): void {
    const peer = this.ensurePeer(peerId);
    // Se ja estou transmitindo, a offer inicial ja sai com a track dentro.
    this.attachLocalStream(peer);
    // Criar o DataChannel gera a m-line e dispara o negotiationneeded (a offer).
    if (!peer.channel) {
      peer.channel = peer.pc.createDataChannel('control', { ordered: true });
      this.wireChannel(peer, peer.channel);
    }
  }

  disconnect(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    peer.channel?.close();
    peer.pc.onicecandidate = null;
    peer.pc.onnegotiationneeded = null;
    peer.pc.onconnectionstatechange = null;
    peer.pc.onsignalingstatechange = null;
    peer.pc.ondatachannel = null;
    peer.pc.ontrack = null;
    peer.pc.close();

    this.peers.delete(peerId);
    this.listener(peerId, 'closed');
  }

  /** Envia uma mensagem de controle pelo DataChannel (usado nas etapas seguintes). */
  send(peerId: string, message: unknown): boolean {
    const channel = this.peers.get(peerId)?.channel;
    if (channel?.readyState !== 'open') return false;
    channel.send(JSON.stringify(message));
    return true;
  }

  getConnection(peerId: string): RTCPeerConnection | undefined {
    return this.peers.get(peerId)?.pc;
  }

  private ensurePeer(peerId: string): Peer {
    const existing = this.peers.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      // Pool pequeno: adianta candidatos sem custo relevante.
      iceCandidatePoolSize: 2,
    });

    const peer: Peer = {
      id: peerId,
      pc,
      channel: null,
      // Comparar ids dá resultados opostos nas duas pontas, sem combinar nada.
      polite: this.selfId > peerId,
      makingOffer: false,
      ignoreOffer: false,
      senders: [],
    };
    this.peers.set(peerId, peer);

    pc.onnegotiationneeded = async () => {
      try {
        peer.makingOffer = true;
        await pc.setLocalDescription();
        this.signal(peerId, { description: pc.localDescription?.toJSON() });
      } catch (err) {
        console.error('[webrtc] falha ao criar offer', err);
      } finally {
        peer.makingOffer = false;
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) this.signal(peerId, { candidate: candidate.toJSON() });
    };

    pc.onconnectionstatechange = () => {
      this.listener(peerId, pc.connectionState as PeerState);
    };

    // Quem recebe o canal do outro lado.
    pc.ondatachannel = ({ channel }) => {
      peer.channel = channel;
      this.wireChannel(peer, channel);
    };

    // Chegou mídia do outro lado: entrega para a interface exibir.
    pc.ontrack = ({ streams, track }) => {
      const stream = streams[0];
      if (!stream) return;

      this.onRemoteStream(peerId, stream);
      track.onended = () => this.onRemoteStream(peerId, null);
      stream.onremovetrack = () => {
        if (stream.getTracks().length === 0) this.onRemoteStream(peerId, null);
      };
    };

    // Toda vez que a sinalizacao assenta, checamos se falta anexar a midia.
    // Cobre: entrei transmitindo, comecei a transmitir durante uma negociacao,
    // ou alguem chegou enquanto eu ja transmitia.
    pc.onsignalingstatechange = () => {
      if (pc.signalingState === 'stable') this.attachLocalStream(peer);
    };

    this.listener(peerId, 'new');
    return peer;
  }

  private wireChannel(peer: Peer, channel: RTCDataChannel): void {
    channel.onopen = () => {
      // Handshake simples: confirma que o caminho P2P está de pé de verdade.
      channel.send(JSON.stringify({ type: 'hello', from: this.selfId }));
    };
    channel.onmessage = (event) => {
      window.dispatchEvent(
        new CustomEvent('peer:message', {
          detail: { from: peer.id, data: JSON.parse(event.data) },
        })
      );
    };
  }

  private signal(to: string, payload: { description?: unknown; candidate?: unknown }): void {
    socket.emit('webrtc:signal', { to, ...payload });
  }

  /** Perfect negotiation, conforme a receita do W3C. */
  private handleSignal = async ({ from, description, candidate }: IncomingSignal) => {
    const peer = this.ensurePeer(from);
    const { pc } = peer;

    try {
      if (description) {
        const sdp = description as RTCSessionDescriptionInit;
        const collision =
          sdp.type === 'offer' && (peer.makingOffer || pc.signalingState !== 'stable');

        peer.ignoreOffer = !peer.polite && collision;
        if (peer.ignoreOffer) return;

        await pc.setRemoteDescription(sdp);
        if (sdp.type === 'offer') {
          await pc.setLocalDescription();
          this.signal(from, { description: pc.localDescription?.toJSON() });
        }
      } else if (candidate) {
        try {
          await pc.addIceCandidate(candidate as RTCIceCandidateInit);
        } catch (err) {
          // Candidato de uma offer ignorada: descartar é o comportamento correto.
          if (!peer.ignoreOffer) throw err;
        }
      }
    } catch (err) {
      console.error('[webrtc] erro na sinalização', err);
    }
  };
}

export const peerManager = new PeerManager();

// Handle de depuração no dev: inspecionar getStats() pelo console do app.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__peers = peerManager;
}
