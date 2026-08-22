import { useState } from 'react';

interface RoomHeaderProps {
  code: string;
}

export default function RoomHeader({ code }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <header className="room-header">
      <div className="room-header__info">
        <span className="room-header__label">Sala</span>
        <strong className="room-header__code">{code}</strong>
      </div>
      <button className="btn btn--tiny" onClick={copy}>
        {copied ? 'Copiado!' : 'Copiar código'}
      </button>
    </header>
  );
}
