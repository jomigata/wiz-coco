type WizcocoLogoProps = {
  className?: string;
  alt?: string;
};

const LOGO_SRC = '/img/Wizcoco-Logo2.jpg';

export default function WizcocoLogo({ className, alt = 'Wizcoco' }: WizcocoLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}

