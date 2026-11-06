/**
 * Universal Rigid Body & Container Scroll Lock
 * Locks background scrolling completely on mobile and desktop by:
 * - Setting document.documentElement and document.body to 'modal-open'
 * - Setting document.body.style.position = 'fixed'
 * - Setting document.body.style.top = `-${scrollY}px`
 * - Directly locking #app-scroll-container (overflowY = 'hidden', overscrollBehavior = 'none')
 * - Restoring exact window.scrollY and #app-scroll-container.scrollTop on unlock
 * Supports reference counting for nested/concurrent modal instances.
 */

let lockCount = 0;
let previousScrollY = 0;
let previousContainerScrollTop = 0;

export const lockBodyScroll = (): (() => void) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const container = document.getElementById('app-scroll-container');

  if (lockCount === 0) {
    previousScrollY = window.scrollY || window.pageYOffset || 0;
    if (container) {
      previousContainerScrollTop = container.scrollTop;
      container.style.overflowY = 'hidden';
      container.style.overscrollBehavior = 'none';
    }

    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
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
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');

      if (container) {
        container.style.overflowY = '';
        container.style.overscrollBehavior = '';
        container.scrollTop = previousContainerScrollTop;
      }

      const restoredY = topVal ? parseInt(topVal, 10) * -1 : previousScrollY;
      window.scrollTo(0, Math.max(0, restoredY));
    }
  };
};

export const unlockBodyScroll = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  lockCount = 0;
  const container = document.getElementById('app-scroll-container');
  const topVal = document.body.style.top;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');

  if (container) {
    container.style.overflowY = '';
    container.style.overscrollBehavior = '';
    container.scrollTop = previousContainerScrollTop;
  }

  const restoredY = topVal ? parseInt(topVal, 10) * -1 : previousScrollY;
  window.scrollTo(0, Math.max(0, restoredY));
};

