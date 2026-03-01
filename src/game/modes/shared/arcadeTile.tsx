// Generic arcade tile component used across demo files
// Eliminates duplication in candy, shoppingSpree, gemBlast, gravityDrop tiles

interface ArcadeTileProps {
  readonly sym: string;
  readonly colors: Record<string, string>;
  readonly highlight?: boolean;
  readonly small?: boolean;
  readonly flashSale?: boolean;
}

export function ArcadeTile({
  sym,
  colors,
  highlight = false,
  small = false,
  flashSale = false,
}: ArcadeTileProps) {
  const col = colors[sym] ?? '#6366f1';
  const size = small ? 34 : 42;

  // Flatten nested ternaries using conditional logic
  let borderStyle = `2px solid ${col}30`;
  if (highlight) {
    borderStyle = `2px solid ${col}`;
  }
  if (flashSale) {
    borderStyle = '2px solid #fbbf24';
  }

  let boxShadowStyle = 'none';
  if (highlight) {
    boxShadowStyle = `0 0 12px ${col}70`;
  }
  if (flashSale) {
    boxShadowStyle = '0 0 18px rgba(251,191,36,0.8)';
  }

  const backgroundStyle = highlight
    ? `linear-gradient(145deg, ${col}44 0%, ${col}22 100%)`
    : 'rgba(10,10,20,0.6)';

  const fontSize = small ? '1rem' : '1.2rem';
  const opacity = highlight ? 1 : 0.35;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        background: backgroundStyle,
        border: borderStyle,
        boxShadow: boxShadowStyle,
        opacity,
      }}
    >
      {sym}
    </div>
  );
}
