/** Chiziqli belgilar (sf-tizim:430, 572-593): viewBox 24, yumaloq uchlar, `fill:none`, emoji yo‘q. */
type IconProps = { size?: number; width?: number; className?: string };

function Svg({ size = 20, width = 2, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg className={`icon${className ? ` ${className}` : ""}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const CheckIcon = (props: IconProps) => <Svg width={2.2} {...props}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const AlertIcon = (props: IconProps) => <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16h.01" /></Svg>;
export const PhoneIcon = (props: IconProps) => <Svg size={24} {...props}><path d="M6.5 3.5h3l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" /></Svg>;
export const PhoneS3Icon = (props: IconProps) => <Svg width={1.8} {...props}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Svg>;
export const NoCardIcon = (props: IconProps) => <Svg width={1.8} {...props}><path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 10h18M4 3l16 18" /></Svg>;
export const DocIcon = (props: IconProps) => <Svg width={1.8} {...props}><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4zM14 3v4h4M9 13h6M9 17h6" /></Svg>;
export const PlayIcon = (props: IconProps) => <Svg width={1.75} {...props}><path d="M8 5.5v13l10.5-6.5z" /></Svg>;
export const BackIcon = (props: IconProps) => <Svg size={24} width={1.75} {...props}><path d="m15 5-7 7 7 7" /></Svg>;
