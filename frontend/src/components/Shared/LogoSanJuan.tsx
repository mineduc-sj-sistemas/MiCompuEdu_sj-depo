import React from 'react';

interface LogoProps {
  className?: string;
  showMinistry?: boolean;
}

export const LogoSanJuan: React.FC<LogoProps> = ({ className = '', showMinistry = true }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        viewBox="0 0 390 90" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-auto select-none"
      >
        {/* EMBLEMA SOLAR (ROSETA DE SAN JUAN) */}
        <g transform="translate(5, -8)">
          {/* Capa de Pétalos Amarillos (Exterior) */}
          <circle cx="45" cy="27" r="16" fill="#FBDD40" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="63" cy="35" r="16" fill="#FBDD40" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="71" cy="53" r="16" fill="#FBDD40" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="63" cy="71" r="16" fill="#FBDD40" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="45" cy="79" r="16" fill="#FBDD40" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="27" cy="71" r="16" fill="#FBDD40" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="19" cy="53" r="16" fill="#FBDD40" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="27" cy="35" r="16" fill="#FBDD40" stroke="#FFFFFF" strokeWidth="2.5" />

          {/* Capa de Pétalos Naranjas (Medio) */}
          <circle cx="45" cy="33" r="15" fill="#FF8200" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="59" cy="39" r="15" fill="#FF8200" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="65" cy="53" r="15" fill="#FF8200" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="59" cy="67" r="15" fill="#FF8200" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="45" cy="73" r="15" fill="#FF8200" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="31" cy="67" r="15" fill="#FF8200" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="25" cy="53" r="15" fill="#FF8200" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="31" cy="39" r="15" fill="#FF8200" stroke="#FFFFFF" strokeWidth="2" />

          {/* Núcleo Rojo (Centro) */}
          <circle cx="45" cy="53" r="14" fill="#E03C31" stroke="#FFFFFF" strokeWidth="2" />
        </g>

        {/* TEXTO: SAN JUAN GOBIERNO */}
        <text x="110" y="44" fill="#1D252D" fontSize="23" fontWeight="800" fontFamily="Ubuntu, sans-serif" letterSpacing="-0.5">San Juan</text>
        <text x="110" y="64" fill="#1D252D" fontSize="19" fontWeight="300" fontFamily="Ubuntu, sans-serif">Gobierno</text>

        {showMinistry && (
          <>
            {/* LÍNEA SEPARADORA */}
            <line x1="225" y1="15" x2="225" y2="70" stroke="#1D252D" strokeWidth="2" opacity="0.8" />

            {/* TEXTO: MINISTERIO DE EDUCACIÓN */}
            <text x="245" y="38" fill="#1D252D" fontSize="11" fontWeight="bold" fontFamily="Ubuntu, sans-serif" letterSpacing="0.5">MINISTERIO DE</text>
            <text x="245" y="60" fill="#1D252D" fontSize="21" fontWeight="800" fontFamily="Ubuntu, sans-serif" letterSpacing="-0.5">EDUCACIÓN</text>
          </>
        )}
      </svg>
    </div>
  );
};
