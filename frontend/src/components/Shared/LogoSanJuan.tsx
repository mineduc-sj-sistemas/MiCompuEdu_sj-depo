import React from 'react';

interface LogoProps {
  className?: string;
  showMinistry?: boolean;
  height?: number;       // altura en px (desktop)
  heightMobile?: number; // altura en px (mobile)
}

export const LogoSanJuan: React.FC<LogoProps> = ({
  className = '',
  // showMinistry es ignorado ahora porque el logo oficial ya incluye
  // "Ministerio de Educación" embebido en la imagen
  height = 160,
  heightMobile = 100,
}) => {
  return (
    <div
      className={`flex items-center ${className}`}
      style={{ lineHeight: 0 }}
    >
      <style>{`
        .logo-sj-img {
          height: ${height}px;
          width: auto;
          display: block;
          object-fit: contain;
        }
        @media (max-width: 768px) {
          .logo-sj-img {
            height: ${heightMobile}px;
          }
        }
      `}</style>
      <img
        src="/logo-san-juan.png"
        alt="San Juan Gobierno – Ministerio de Educación"
        className="logo-sj-img"
        draggable={false}
      />
    </div>
  );
};
