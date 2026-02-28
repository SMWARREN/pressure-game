/**
 * Lazy style injection utilities — inject animations once per session
 */

let spinnerStylesInjected = false;
export function ensureSpinnerStyles() {
  if (spinnerStylesInjected || typeof document === 'undefined') return;
  spinnerStylesInjected = true;
  const el = document.createElement('style');
  el.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(el);
}

let notifStylesInjected = false;
export function ensureNotifStyles() {
  if (notifStylesInjected || typeof document === 'undefined') return;
  notifStylesInjected = true;
  const el = document.createElement('style');
  el.textContent = `
    @keyframes notifFloat {
      0% {
        opacity: 1;
        transform: translateY(0px);
      }
      80% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translateY(-40px);
      }
    }
  `;
  document.head.appendChild(el);
}
