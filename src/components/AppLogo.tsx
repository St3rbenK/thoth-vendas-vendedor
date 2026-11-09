import React, { useId } from 'react'

export type ProductId = 'fy' | 'vendas' | 'erp' | 'pontua' | 'whats' | 'mail' | 'vet' | 'pdv' | 'admin'
export type LogoSize = 'sm' | 'md' | 'lg'

interface ProductConfig {
  id: string
  prefix: string
  suffix: string
  primary: string
  secondary: string
  sublabel: string
}

const PRODUCTS: Record<ProductId, ProductConfig> = {
  fy: {
    id: 'thothfy',
    prefix: 'thoth',
    suffix: 'fy',
    primary: '#0040E5',
    secondary: '#002699',
    sublabel: 'Central da Conta',
  },
  admin: {
    id: 'thoth-admin',
    prefix: 'thoth',
    suffix: 'admin',
    primary: '#0040E5',
    secondary: '#002699',
    sublabel: 'Console Super Admin',
  },
  vendas: {
    id: 'thoth-vendas',
    prefix: 'thoth',
    suffix: 'vendas',
    primary: '#10B981',
    secondary: '#047857',
    sublabel: 'Gestão B2B & Catálogo',
  },
  erp: {
    id: 'thoth-erp',
    prefix: 'thoth',
    suffix: 'erp',
    primary: '#0284C7',
    secondary: '#0369A1',
    sublabel: 'Gestão Financeira & Fiscal',
  },
  pontua: {
    id: 'thoth-pontua',
    prefix: 'thoth',
    suffix: 'pontua',
    primary: '#7C3AED',
    secondary: '#5B21B6',
    sublabel: 'Fidelidade & Cashback',
  },
  whats: {
    id: 'thoth-whats',
    prefix: 'thoth',
    suffix: 'whats',
    primary: '#25D366',
    secondary: '#16A34A',
    sublabel: 'WhatsApp & Mensageria',
  },
  mail: {
    id: 'thoth-mail',
    prefix: 'thoth',
    suffix: 'mail',
    primary: '#4F46E5',
    secondary: '#3730A3',
    sublabel: 'E-mail Corporativo',
  },
  vet: {
    id: 'thoth-vet',
    prefix: 'thoth',
    suffix: 'vet',
    primary: '#22C55E',
    secondary: '#15803D',
    sublabel: 'Saúde Animal',
  },
  pdv: {
    id: 'thoth-pdv',
    prefix: 'thoth',
    suffix: 'pdv',
    primary: '#F43F5E',
    secondary: '#BE123C',
    sublabel: 'Frente de Caixa',
  },
}

interface AppLogoProps {
  product?: ProductId
  showText?: boolean
  showSublabel?: boolean
  sublabel?: string
  size?: LogoSize
  variant?: 'light' | 'dark'
  className?: string
}

export const AppLogo: React.FC<AppLogoProps> = ({
  product = 'vendas',
  showText = true,
  showSublabel = false,
  sublabel,
  size = 'md',
  variant = 'light',
  className = '',
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const config = PRODUCTS[product] || PRODUCTS.vendas
  const gradId = `app-grad-${config.id}-${uid}`
  const glowId = `app-glow-${config.id}-${uid}`
  const shadowId = `app-shadow-${config.id}-${uid}`

  const iconSizeClass =
    size === 'sm'
      ? 'h-8 w-8 rounded-lg'
      : size === 'lg'
      ? 'h-12 w-12 rounded-2xl'
      : 'h-10 w-10 rounded-xl'

  const textSizeClass =
    size === 'sm'
      ? 'text-lg leading-tight'
      : size === 'lg'
      ? 'text-2xl leading-none'
      : 'text-xl leading-none'

  const prefixColorClass = variant === 'dark' ? 'text-white' : 'text-slate-900'
  const sublabelColorClass = variant === 'dark' ? 'text-slate-300' : 'text-slate-500'

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Ícone Squircle com gradiente oficial e mascote Thoth em branco */}
      <div
        className={`${iconSizeClass} relative shrink-0 overflow-hidden shadow-sm transition-transform duration-200 hover:scale-105`}
      >
        <svg viewBox="0 0 56 56" className="w-full h-full block" fill="none">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={config.primary} />
              <stop offset="100%" stopColor={config.secondary} />
            </linearGradient>
            <radialGradient id={glowId} cx="50%" cy="0%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.20" />
            </filter>
          </defs>

          <rect width="56" height="56" rx="13" ry="13" fill={`url(#${gradId})`} />
          <rect width="56" height="56" rx="13" ry="13" fill={`url(#${glowId})`} />
          <rect
            width="54"
            height="54"
            x="1"
            y="1"
            rx="12"
            ry="12"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.22"
            strokeWidth="1"
          />
          <g filter={`url(#${shadowId})`}>
            <g
              transform="translate(28, 28) scale(0.0059451, -0.0059451) translate(-3828.5, -5154.0)"
              fill="#ffffff"
              stroke="none"
            >
              <path d="M4845 7979 c-346 -44 -645 -251 -796 -551 -21 -43 -51 -117 -66 -165 l-27 -88 -4 -412 c-2 -227 -6 -413 -10 -413 -4 0 -29 7 -57 16 -198 60 -498 56 -729 -11 -170 -49 -236 -85 -826 -445 -634 -386 -766 -480 -936 -660 -301 -320 -463 -774 -425 -1188 28 -302 95 -498 271 -782 93 -152 144 -211 210 -245 55 -27 96 -37 160 -37 100 1 92 -3 835 450 153 94 281 170 283 168 2 -2 -23 -60 -55 -128 -57 -122 -58 -124 -58 -213 l1 -90 177 -365 c112 -230 190 -377 210 -398 38 -40 84 -70 129 -83 21 -7 366 -10 951 -10 879 1 920 1 961 20 52 23 106 74 132 127 16 32 20 65 22 187 3 144 3 151 -23 203 -14 29 -44 69 -67 88 -70 60 -102 66 -372 66 l-241 1 -120 168 c-66 93 -121 177 -122 187 -2 11 24 80 56 154 65 152 46 136 202 164 249 45 481 168 670 356 231 230 345 483 368 820 8 117 -1 354 -19 489 -6 41 -8 76 -6 78 3 3 307 -374 705 -874 60 -76 83 -98 134 -123 33 -16 74 -30 90 -30 84 0 161 51 205 134 25 48 27 60 30 222 15 654 -171 1435 -498 2099 -138 279 -355 656 -436 756 -76 95 -199 190 -329 254 -195 96 -378 129 -580 104z m260 -275 c156 -27 299 -101 414 -214 73 -72 126 -149 189 -277 27 -55 77 -149 110 -209 85 -152 241 -477 295 -614 146 -370 239 -730 282 -1090 19 -159 40 -513 32 -534 -12 -31 -35 -15 -112 82 -552 687 -1048 1287 -1075 1302 -34 18 -69 12 -82 -15 -9 -21 -4 -63 30 -238 152 -777 159 -1069 29 -1349 -121 -262 -359 -474 -633 -562 -94 -31 -219 -56 -275 -56 -66 0 -107 -23 -128 -72 -11 -24 -62 -141 -115 -261 -53 -120 -96 -231 -96 -246 0 -40 336 -509 382 -533 29 -16 65 -18 310 -18 326 0 308 7 308 -117 0 -125 97 -113 -886 -113 -574 0 -852 3 -865 11 -11 5 -30 33 -43 62 -12 29 -84 181 -159 338 -92 190 -137 296 -137 319 0 29 74 219 198 507 19 45 32 89 28 98 -5 14 -25 16 -168 13 l-163 -3 -280 -166 c-154 -91 -329 -195 -390 -231 -424 -253 -461 -269 -521 -238 -13 8 -55 61 -93 119 -175 270 -243 484 -244 766 -1 356 131 675 391 947 138 143 216 198 682 478 25 15 180 109 345 210 165 100 334 199 375 220 170 85 363 125 560 116 216 -10 367 -60 548 -184 44 -30 55 -34 62 -22 6 9 10 255 10 585 0 470 3 581 15 633 42 179 158 347 307 443 102 65 202 101 348 123 57 8 130 5 215 -10z" />
              <path d="M4850 7434 c-122 -32 -226 -106 -292 -208 -77 -119 -72 -56 -78 -1061 l-5 -900 -24 -65 c-83 -226 -197 -360 -446 -523 -133 -88 -626 -405 -671 -433 -11 -6 -15 -16 -11 -28 6 -16 41 -17 529 -14 462 3 530 6 582 21 153 45 254 100 357 195 115 106 186 223 231 379 20 67 23 100 22 233 -1 211 -28 372 -195 1182 -19 90 -20 111 -10 136 17 40 65 62 136 62 242 0 458 186 501 433 31 171 -21 332 -145 456 -125 125 -317 179 -481 135z m248 -481 l-3 -138 -130 0 -130 0 -3 138 -3 137 136 0 136 0 -3 -137z" />
              <path d="M5647 6531 c-25 -43 -70 -105 -100 -137 -62 -68 -71 -87 -56 -116 11 -20 353 -447 501 -625 109 -132 119 -113 63 114 -42 172 -99 344 -172 517 -92 217 -151 326 -177 326 -7 0 -34 -35 -59 -79z" />
              <path d="M3707 5836 c-9 -7 -18 -51 -25 -121 -32 -322 -200 -605 -483 -815 -119 -88 -658 -426 -1153 -722 -248 -148 -456 -277 -463 -286 -20 -25 -10 -83 30 -167 66 -139 91 -144 246 -53 775 452 2025 1231 2158 1344 65 56 143 171 167 247 60 191 -62 411 -288 522 -104 51 -168 69 -189 51z" />
              <path d="M3262 5814 c-41 -13 -90 -33 -110 -43 -36 -18 -418 -247 -637 -381 -60 -37 -193 -118 -295 -180 -284 -174 -386 -260 -502 -425 -97 -137 -166 -306 -188 -462 -13 -91 -10 -113 18 -113 16 0 495 278 712 414 364 227 621 390 710 449 210 140 345 303 411 495 23 67 44 211 35 246 -5 22 -12 26 -44 26 -20 0 -70 -12 -110 -26z" />
              <path d="M3422 3903 c-12 -10 -73 -142 -137 -293 -100 -236 -116 -281 -112 -315 5 -45 195 -441 224 -467 16 -14 56 -18 274 -24 141 -4 268 -4 282 0 17 4 27 13 27 24 0 10 -67 111 -149 225 -152 210 -169 245 -152 302 5 17 57 144 116 283 58 139 104 260 101 268 -4 12 -44 14 -230 14 -199 0 -226 -2 -244 -17z" />
            </g>
          </g>
        </svg>
      </div>

      {/* Wordmark Oficial Thothfy */}
      {showText && (
        <div className="min-w-0 flex flex-col justify-center text-left">
          <span className={`font-extrabold tracking-tight truncate flex items-baseline ${textSizeClass}`}>
            <span className={prefixColorClass}>{config.prefix}</span>
            <span style={{ color: config.primary }}>{config.suffix}</span>
          </span>
          {showSublabel && (
            <span className={`block text-[11px] font-medium truncate mt-0.5 ${sublabelColorClass}`}>
              {sublabel || config.sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
