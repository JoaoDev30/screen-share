import { useCallback, useState } from 'react';

/** Volume padrão de quem ainda não foi ajustado. */
const VOLUME_PADRAO = 100;

interface UseVolumesResult {
  /** Volume de 0 a 100 para um participante. */
  getVolume: (peerId: string) => number;
  setVolume: (peerId: string, volume: number) => void;
  /** Mapa cru, para os efeitos que precisam reagir a mudanças. */
  volumes: Record<string, number>;
}

/**
 * Volume por participante, no estilo Discord.
 *
 * Vive em memória: o socket.id muda a cada sessão, então persistir não teria
 * a quem aplicar na próxima vez.
 */
export function useVolumes(): UseVolumesResult {
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  const getVolume = useCallback(
    (peerId: string) => volumes[peerId] ?? VOLUME_PADRAO,
    [volumes]
  );

  const setVolume = useCallback((peerId: string, volume: number) => {
    const limitado = Math.max(0, Math.min(100, Math.round(volume)));
    setVolumes((prev) => (prev[peerId] === limitado ? prev : { ...prev, [peerId]: limitado }));
  }, []);

  return { getVolume, setVolume, volumes };
}
