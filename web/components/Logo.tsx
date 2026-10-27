// Logo propio: dos pulmones estilizados dentro de un lente, con una línea de escaneo.
export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Logo de ThoraxLens" fill="none">
      <defs>
        <linearGradient id="nl-anillo" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
        <radialGradient id="nl-fondo" cx="0" cy="0" r="1" gradientTransform="translate(21 20) rotate(90) scale(18)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" stopOpacity="0.28" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <clipPath id="nl-lente">
          <circle cx="21" cy="21" r="14" />
        </clipPath>
      </defs>

      {/* Lente */}
      <circle cx="21" cy="21" r="16" fill="url(#nl-fondo)" />
      <circle cx="21" cy="21" r="16" stroke="url(#nl-anillo)" strokeWidth="2.5" />
      {/* Mango del lente */}
      <path d="M33 33l9 9" stroke="url(#nl-anillo)" strokeWidth="4" strokeLinecap="round" />

      {/* Pulmones: tráquea con bronquios y dos lóbulos */}
      <g stroke="#e0f2fe" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#nl-lente)">
        <path d="M21 10.5v6.5M21 17l-3 2.5M21 17l3 2.5" />
        <path d="M18.5 15.5c-3.2 0-6.2 3.6-7.2 8-.8 3.4-.3 6.4 2.3 6.9 2.7.5 5.1-1.7 5.9-4.6.9-3.2.7-7.8-1-10.3z" />
        <path d="M23.5 15.5c3.2 0 6.2 3.6 7.2 8 .8 3.4.3 6.4-2.3 6.9-2.7.5-5.1-1.7-5.9-4.6-.9-3.2-.7-7.8 1-10.3z" />
        <path d="M15 22.5l2.3 1.4M15.8 26l2 .9M27 22.5l-2.3 1.4M26.2 26l-2 .9" opacity="0.8" />
      </g>

      {/* Línea de escaneo */}
      <path d="M8.5 24.5h25" stroke="#22d3ee" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
      <circle cx="33.5" cy="24.5" r="1.4" fill="#a5f3fc" />
    </svg>
  );
}
