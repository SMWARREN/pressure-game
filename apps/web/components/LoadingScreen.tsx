export function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000814',
        zIndex: 9999,
        animation: 'fadeOut 0.3s ease-out 1.5s forwards',
      }}
    >
      <style>{`
        @keyframes fadeOut {
          from {
            opacity: 1;
            pointer-events: auto;
          }
          to {
            opacity: 0;
            pointer-events: none;
          }
        }
      `}</style>
      <img
        src="/loading.png"
        alt="Pressure - Pipe Puzzle"
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
