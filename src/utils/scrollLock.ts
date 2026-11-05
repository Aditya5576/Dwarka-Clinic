/**
 * Universal Rigid Body Scroll Lock & Chaining Isolation
 * Locks background scrolling completely on mobile and desktop by setting:
 * - document.body.style.position = 'fixed'
 * - document.body.style.top = `-${scrollY}px`
 * - document.body.style.width = '100%'
 * - document.body.style.overflow = 'hidden'
 *
 * Restores previous scroll position and styles upon cleanup.
 * Supports reference counting for nested/multiple concurrent modal instances.
 */

let lockCount = 0;
let previousScrollY = 0;

export const lockBodyScroll = (): (() => void) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  if (lockCount === 0) {
    previousScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${previousScrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
  lockCount++;

  let unlocked = false;
  return () => {
    if (unlocked) return;
    unlocked = true;
    lockCount = Math.max(0, lockCount - 1);

    if (lockCount === 0) {
      const topVal = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      const restoredY = topVal ? parseInt(topVal, 10) * -1 : previousScrollY;
      window.scrollTo(0, Math.max(0, restoredY));
    }
  };
};

