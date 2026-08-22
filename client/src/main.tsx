import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

/**
 * Sem StrictMode de propósito: o duplo mount do modo dev derruba e recria as
 * RTCPeerConnection no meio da negociação, quebrando o handshake WebRTC.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
