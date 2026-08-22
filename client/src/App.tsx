import Home from './pages/Home';
import Room from './pages/Room';
import SourcePicker from './components/SourcePicker';
import { useRoom } from './hooks/useRoom';
import { usePeers } from './hooks/usePeers';
import { useScreenShare } from './hooks/useScreenShare';
import { useMicrophone } from './hooks/useMicrophone';

export default function App() {
  const {
    connection,
    wakingServer,
    room,
    participants,
    error,
    busy,
    createRoom,
    joinRoom,
    leaveRoom,
    clearError,
  } = useRoom();

  const { peerStates, channelsOpen, remoteStreams, remoteAudio } = usePeers(
    room,
    participants
  );
  const {
    localStream,
    isSharing,
    error: shareError,
    hasSystemAudio,
    systemAudioOn,
    toggleSystemAudio,
    startSharing,
    stopSharing,
  } = useScreenShare(room !== null);
  const { micOn, micError, toggleMic } = useMicrophone(room !== null);

  return (
    <>
      {room ? (
        <Room
          room={room}
          participants={participants}
          peerStates={peerStates}
          channelsOpen={channelsOpen}
          remoteStreams={remoteStreams}
          remoteAudio={remoteAudio}
          localStream={localStream}
          isSharing={isSharing}
          shareError={shareError}
          hasSystemAudio={hasSystemAudio}
          systemAudioOn={systemAudioOn}
          onToggleSystemAudio={toggleSystemAudio}
          micOn={micOn}
          micError={micError}
          onToggleMic={toggleMic}
          onStartShare={startSharing}
          onStopShare={stopSharing}
          onLeave={leaveRoom}
        />
      ) : (
        <Home
          connection={connection}
          wakingServer={wakingServer}
          error={error}
          busy={busy}
          onCreate={createRoom}
          onJoin={joinRoom}
          onClearError={clearError}
        />
      )}

      {/* Fora do if: o seletor do Electron precisa existir sempre que houver sala. */}
      <SourcePicker />
    </>
  );
}
