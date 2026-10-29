interface BrandLogoProps {
  className?: string;
  ariaLabel?: string;
}

export function BrandLogo({ className = "navbar-brand brand-lockup", ariaLabel = "Volver al inicio" }: BrandLogoProps) {
  return (
    <a className={className} href="#inicio" aria-label={ariaLabel}>
      <span className="brand-mark" aria-hidden="true">
        <i className="bi bi-basket2-fill" />
      </span>
      <span>
        <strong>Frutería</strong>
        <small>Oxkutzcab</small>
      </span>
    </a>
  );
}
