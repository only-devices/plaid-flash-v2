/**
 * Detects if the current device is a mobile device
 * Uses multiple detection methods for reliability
 */
export function isMobileDevice(): boolean {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    return false;
  }

  // Check 1: User agent string
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isMobileUA = mobileRegex.test(userAgent.toLowerCase());

  // Check 2: Screen width (less than 768px is considered mobile)
  const isMobileWidth = window.innerWidth < 768;

  // Check 3: Touch capability (additional indicator)
  const hasTouchScreen = (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );

  // Return true if user agent indicates mobile OR if screen is small with touch capability
  return isMobileUA || (isMobileWidth && hasTouchScreen);
}



