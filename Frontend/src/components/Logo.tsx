export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="9" fill="#070235" />
      {/* Graduation cap — diamond top */}
      <path d="M18 9L28 14L18 19L8 14Z" fill="white" />
      {/* Cap body */}
      <path
        d="M12 16.5V21.5C12 21.5 14.5 25 18 25C21.5 25 24 21.5 24 21.5V16.5"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tassel */}
      <line x1="27.5" y1="14" x2="27.5" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="27.5" cy="21.5" r="1.5" fill="white" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  textColor?: string;
  className?: string;
}

export default function Logo({ size = 36, textColor = '#070235', className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-bold text-[15px] leading-none tracking-tight"
        style={{ color: textColor }}
      >
        Uzair TC
      </span>
    </div>
  );
}
