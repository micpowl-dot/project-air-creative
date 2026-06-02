// The AI DAY event-mark logo, inlined from
// "Project Air elements/center-top/event-mark.svg" so its color is dynamic.
// Original art uses three fills: #FFE500 (yellow), black, white.
// Per Michael: the YELLOW is driven by the active scheme's accent swatch; the
// black/white parts stay fixed.

export function AiDayLogo({
  accent = "#FFE500",
  ink = "#000000",
  light = "#ffffff",
  className,
  style,
}: {
  accent?: string;
  ink?: string;
  light?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 798 331"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="AI DAY"
    >
      <path d="M553.492 2.72792H521.41V111.256L547.579 198.255H521.41V263.444H567.112L586.671 328.606H651.892L553.492 2.72792Z" fill={accent} />
      <path d="M475.735 263.444H521.423V328.619H456.176L475.735 263.444ZM495.268 198.255H521.41V111.256L495.268 198.255Z" fill={ink} />
      <path d="M97.3296 2.72792H65.2476V111.256L91.4029 198.255H65.2476V263.444H110.949L130.509 328.606H195.729L97.3296 2.72792Z" fill={light} />
      <path d="M19.5596 263.444H65.2476V328.619H0L19.5596 263.444ZM39.1058 198.255H65.2476V111.256L39.1058 198.255Z" fill={ink} />
      <path d="M266.908 2.72791H201.661V328.606H266.908V2.72791Z" fill={light} />
      <path d="M462.919 68.0105C462.919 31.9949 433.686 2.78143 397.658 2.78143H332.477L332.504 68.0105H397.751L397.725 263.497H332.504V328.619L397.685 328.593C433.713 328.593 462.905 299.433 462.919 263.417L462.972 68.1308L462.919 68.0105Z" fill={accent} />
      <path d="M267.27 67.9571L267.243 263.497H332.49V67.9571H267.27Z" fill={ink} />
      <path d="M730.103 2.78143H795.324L730.103 198.255V328.606H664.896V198.255L730.103 2.78143Z" fill={accent} />
      <path d="M664.896 198.255V2.78128H599.648L664.896 198.255Z" fill={ink} />
    </svg>
  );
}
