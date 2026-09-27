import React from 'react';

interface MiniPosPersonIllustrationProps {
  className?: string;
}

export const MiniPosPersonIllustration: React.FC<MiniPosPersonIllustrationProps> = ({
  className = 'w-full h-auto',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(6px) rotate(-2deg); }
        }
        @keyframes pulseSoft {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        @keyframes receiptFeed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes waveHand {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        .anim-float-slow {
          animation: floatSlow 3.8s ease-in-out infinite;
        }
        .anim-float-rev {
          animation: floatReverse 4.2s ease-in-out infinite;
        }
        .anim-pulse-soft {
          animation: pulseSoft 3s ease-in-out infinite;
        }
        .anim-receipt {
          animation: receiptFeed 2.8s ease-in-out infinite;
        }
        .anim-wave {
          transform-origin: 220px 180px;
          animation: waveHand 3s ease-in-out infinite;
        }
      `}</style>

      <svg
        viewBox="0 0 460 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-[310px] drop-shadow-sm"
      >
        <defs>
          {/* Orange Citrus Gradients */}
          <linearGradient id="citrusPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          <linearGradient id="citrusWarm" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <linearGradient id="posScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          <linearGradient id="apronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#f97316" floodOpacity="0.18" />
          </filter>

          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* ========================================================================= */}
        {/* AMBIENT BACKGROUND GLOWS (Clean Warm Pastel) */}
        {/* ========================================================================= */}
        <circle cx="230" cy="180" r="140" fill="#fff7ed" />
        <circle cx="160" cy="140" r="100" fill="#ffedd5" fillOpacity="0.75" />
        <circle cx="320" cy="190" r="90" fill="#fef3c7" fillOpacity="0.6" />

        {/* Floor Grounding Ellipse */}
        <ellipse cx="230" cy="335" rx="190" ry="14" fill="#fed7aa" fillOpacity="0.45" />
        <ellipse cx="230" cy="335" rx="140" ry="8" fill="#fdba74" fillOpacity="0.3" />

        {/* ========================================================================= */}
        {/* CASHIER COUNTER DESK (Right side) */}
        {/* ========================================================================= */}
        <g id="counter-desk">
          {/* Main Counter Base */}
          <rect x="235" y="225" width="180" height="105" rx="14" fill="#ffffff" stroke="#fed7aa" strokeWidth="2" filter="url(#cardShadow)" />
          {/* Counter Top Panel */}
          <rect x="225" y="215" width="200" height="16" rx="8" fill="url(#citrusPrimary)" />
          {/* Counter Front Wood Grain / Accent lines */}
          <rect x="245" y="242" width="160" height="8" rx="4" fill="#ffedd5" />
          <rect x="245" y="258" width="120" height="8" rx="4" fill="#fff7ed" />
          <rect x="245" y="274" width="140" height="8" rx="4" fill="#fff7ed" />
          
          {/* Barcode Scanner on stand */}
          <rect x="375" y="195" width="8" height="24" rx="4" fill="#64748b" />
          <path d="M370 195 L392 195 L388 185 L374 185 Z" fill="#0f172a" />
          <circle cx="388" cy="188" r="2" fill="#ef4444" />
        </g>

        {/* ========================================================================= */}
        {/* POS TERMINAL / TABLET DISPLAY */}
        {/* ========================================================================= */}
        <g id="pos-terminal" className="anim-pulse-soft">
          {/* Stand */}
          <rect x="282" y="195" width="16" height="24" rx="3" fill="#475569" />
          <ellipse cx="290" cy="218" rx="20" ry="6" fill="#334155" />

          {/* POS Tablet Frame (Angled display) */}
          <rect x="248" y="125" width="84" height="74" rx="8" fill="#1e293b" stroke="#f97316" strokeWidth="2.5" filter="url(#softGlow)" />
          
          {/* POS Screen */}
          <rect x="253" y="130" width="74" height="64" rx="5" fill="url(#posScreenGrad)" />

          {/* MiniPos Header on Screen */}
          <rect x="257" y="134" width="66" height="12" rx="3" fill="#f97316" />
          <text x="290" y="143" fill="#ffffff" fontSize="7.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">
            MiniPos
          </text>

          {/* Transaction Live Rows */}
          <rect x="257" y="150" width="40" height="4" rx="2" fill="#38bdf8" />
          <rect x="302" y="150" width="21" height="4" rx="2" fill="#4ade80" />

          <rect x="257" y="158" width="46" height="4" rx="2" fill="#94a3b8" />
          <rect x="307" y="158" width="16" height="4" rx="2" fill="#f97316" />

          {/* Big Amount on POS Display */}
          <rect x="257" y="167" width="66" height="16" rx="4" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="0.8" />
          <text x="290" y="178" fill="#38bdf8" fontSize="8" fontWeight="800" fontFamily="monospace" textAnchor="middle">
            Rp 150.000
          </text>
          <circle cx="316" cy="175" r="2.5" fill="#4ade80" />
        </g>

        {/* ========================================================================= */}
        {/* THERMAL PRINTER & ANIMATED RECEIPT */}
        {/* ========================================================================= */}
        <g id="thermal-printer" transform="translate(340, 165)">
          {/* Printer Body */}
          <rect x="0" y="24" width="38" height="28" rx="6" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="6" y="27" width="26" height="4" rx="2" fill="#0f172a" />
          <circle cx="30" cy="42" r="2" fill="#22c55e" />

          {/* Animated Printing Receipt Paper */}
          <g className="anim-receipt">
            <path
              d="M8 26 L8 0 L12 3 L16 0 L20 3 L24 0 L28 3 L30 0 L30 26 Z"
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="1"
              filter="url(#cardShadow)"
            />
            {/* Receipt text lines */}
            <line x1="12" y1="6" x2="26" y2="6" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="11" y1="10" x2="27" y2="10" stroke="#64748b" strokeWidth="1" strokeLinecap="round" />
            <line x1="11" y1="13" x2="24" y2="13" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
            <line x1="11" y1="17" x2="27" y2="17" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>

        {/* ========================================================================= */}
        {/* FRIENDLY CASHIER / AGENT CHARACTER (Left/Center) */}
        {/* ========================================================================= */}
        <g id="character-person">
          {/* Shadow beneath person */}
          <ellipse cx="160" cy="332" rx="42" ry="7" fill="#ea580c" fillOpacity="0.2" />

          {/* Legs / Trousers */}
          <rect x="142" y="260" width="16" height="70" rx="7" fill="#1e293b" />
          <rect x="162" y="260" width="16" height="70" rx="7" fill="#0f172a" />
          {/* Shoes */}
          <ellipse cx="148" cy="332" rx="14" ry="6" fill="#334155" />
          <ellipse cx="172" cy="332" rx="14" ry="6" fill="#1e293b" />

          {/* Torso & Uniform Shirt (Light Blue / White base) */}
          <path d="M135 170 Q160 162 185 170 L195 265 L125 265 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          
          {/* Orange MiniPos Apron */}
          <path d="M140 185 Q160 182 180 185 L188 260 L132 260 Z" fill="url(#apronGrad)" stroke="#c2410c" strokeWidth="1.2" />
          {/* Apron Straps */}
          <path d="M145 185 L135 155" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
          <path d="M175 185 L185 155" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
          {/* Apron Pocket with Pen */}
          <rect x="148" y="215" width="24" height="22" rx="4" fill="#c2410c" />
          <line x1="154" y1="210" x2="154" y2="218" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="208" x2="160" y2="218" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          {/* MiniPos Badge on Chest */}
          <rect x="146" y="192" width="28" height="12" rx="4" fill="#ffffff" stroke="#ea580c" strokeWidth="1" />
          <text x="160" y="200.5" fill="#ea580c" fontSize="6.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
            MiniPos
          </text>

          {/* Head & Neck */}
          <rect x="153" y="142" width="14" height="18" rx="5" fill="#fbd2a9" />
          
          {/* Face (Friendly, Smiling) */}
          <ellipse cx="160" cy="120" rx="22" ry="25" fill="#fcd9b8" />
          {/* Ears */}
          <ellipse cx="138" cy="122" rx="4" ry="7" fill="#fbd2a9" />
          <ellipse cx="182" cy="122" rx="4" ry="7" fill="#fbd2a9" />
          {/* Hair (Neat Modern Style) */}
          <path
            d="M138 116 Q138 95 160 95 Q182 95 182 116 Q178 100 162 100 Q144 100 138 116 Z"
            fill="#1e293b"
          />
          <path d="M138 110 Q145 92 165 93 Q175 93 182 104" fill="#0f172a" />

          {/* Eyebrows */}
          <path d="M148 111 Q153 109 156 111" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M164 111 Q167 109 172 111" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />

          {/* Eyes (Happy, Friendly curve) */}
          <circle cx="152" cy="117" r="2.5" fill="#0f172a" />
          <circle cx="168" cy="117" r="2.5" fill="#0f172a" />
          <circle cx="153" cy="116" r="0.8" fill="#ffffff" />
          <circle cx="169" cy="116" r="0.8" fill="#ffffff" />

          {/* Rosy Cheeks */}
          <ellipse cx="147" cy="123" rx="3.5" ry="2" fill="#f87171" fillOpacity="0.45" />
          <ellipse cx="173" cy="123" rx="3.5" ry="2" fill="#f87171" fillOpacity="0.45" />

          {/* Nose */}
          <path d="M160 119 Q161 123 158 124" stroke="#e0a97a" strokeWidth="1.2" strokeLinecap="round" fill="none" />

          {/* Big Warm Smile */}
          <path d="M153 128 Q160 135 167 128" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" fill="#ffffff" />

          {/* Left Arm: Presenting / Pointing proudly to MiniPos Screen */}
          <g id="arm-presenting">
            <path
              d="M185 175 Q215 185 245 178"
              stroke="#ffffff"
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            />
            {/* Hand open presenting towards screen */}
            <ellipse cx="248" cy="177" rx="8" ry="6" fill="#fcd9b8" />
            {/* Fingers gesture */}
            <path d="M250 173 L256 173" stroke="#fbd2a9" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M251 176 L258 177" stroke="#fbd2a9" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M250 180 L256 181" stroke="#fbd2a9" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Right Arm: Friendly Welcoming Wave */}
          <g id="arm-welcoming" className="anim-wave">
            <path
              d="M135 175 Q115 170 102 145"
              stroke="#ffffff"
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            />
            {/* Hand waving */}
            <ellipse cx="98" cy="138" rx="8" ry="8" fill="#fcd9b8" />
            <path d="M93 133 L93 125" stroke="#fcd9b8" strokeWidth="3" strokeLinecap="round" />
            <path d="M97 131 L98 123" stroke="#fcd9b8" strokeWidth="3" strokeLinecap="round" />
            <path d="M102 133 L104 125" stroke="#fcd9b8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M106 137 L110 132" stroke="#fcd9b8" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>

        {/* ========================================================================= */}
        {/* FLOATING INTERACTIVE ELEMENTS (Fintech / Mini ATM Icons) */}
        {/* ========================================================================= */}

        {/* 1. Floating ATM Debit Card (Top Left) */}
        <g id="floating-card" className="anim-float-slow">
          <rect
            x="35"
            y="70"
            width="82"
            height="50"
            rx="8"
            fill="url(#cardGrad)"
            stroke="#ffffff"
            strokeWidth="1.5"
            filter="url(#cardShadow)"
            transform="rotate(-8 76 95)"
          />
          {/* Card EMV Gold Chip */}
          <rect x="48" y="82" width="13" height="10" rx="2" fill="#fbbf24" stroke="#d97706" strokeWidth="0.6" transform="rotate(-8 48 82)" />
          {/* Contactless waves */}
          <path d="M68 82 Q72 85 71 90" stroke="#bae6fd" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M72 81 Q77 85 76 92" stroke="#bae6fd" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* Bank / ATM logo text */}
          <text x="82" y="112" fill="#ffffff" fontSize="7.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.8">
            MINI ATM
          </text>
        </g>

        {/* 2. Floating Rupiah Coin / Cash (Top Center) */}
        <g id="floating-coin" className="anim-float-rev">
          <circle cx="215" cy="55" r="22" fill="url(#citrusWarm)" stroke="#ffffff" strokeWidth="2" filter="url(#softGlow)" />
          <circle cx="215" cy="55" r="18" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1" strokeDasharray="3 2" />
          <text x="215" y="61" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
            Rp
          </text>
        </g>

        {/* 3. Floating Security Shield (Top Right) */}
        <g id="floating-shield" className="anim-float-slow">
          <path
            d="M380 45 Q395 40 410 45 Q410 75 395 88 Q380 75 380 45 Z"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="2"
            filter="url(#cardShadow)"
          />
          {/* Checkmark inside shield */}
          <path d="M388 64 L393 69 L402 58" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* 4. Welcoming Speech Bubble from Cashier */}
        <g id="speech-bubble" className="anim-pulse-soft">
          <rect
            x="50"
            y="180"
            width="82"
            height="36"
            rx="10"
            fill="#ffffff"
            stroke="#fdba74"
            strokeWidth="1.5"
            filter="url(#cardShadow)"
          />
          {/* Speech bubble pointer */}
          <path d="M125 198 L136 202 L127 206 Z" fill="#ffffff" />
          <path d="M125 198 L136 202 L127 206" stroke="#fdba74" strokeWidth="1.5" fill="none" />
          <text x="91" y="195" fill="#ea580c" fontSize="8" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
            Hai! Selamat
          </text>
          <text x="91" y="206" fill="#0f172a" fontSize="7.5" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">
            Datang di MiniPos!
          </text>
        </g>
      </svg>
    </div>
  );
};
