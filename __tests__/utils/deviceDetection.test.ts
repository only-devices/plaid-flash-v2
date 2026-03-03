/**
 * @jest-environment jsdom
 */

import { isMobileDevice } from '@/utils/deviceDetection';

describe('isMobileDevice', () => {
  const originalNavigator = window.navigator;
  const originalInnerWidth = window.innerWidth;

  function mockUserAgent(ua: string) {
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        userAgent: ua,
        vendor: '',
        maxTouchPoints: 0,
      },
      writable: true,
      configurable: true,
    });
  }

  function mockWindowWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
      value: width,
      writable: true,
      configurable: true,
    });
  }

  function mockTouchSupport(hasTouch: boolean) {
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        maxTouchPoints: hasTouch ? 1 : 0,
      },
      writable: true,
      configurable: true,
    });
  }

  afterEach(() => {
    // Reset to defaults
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });
  });

  it('returns false for desktop user agents', () => {
    mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    mockWindowWidth(1024);
    expect(isMobileDevice()).toBe(false);
  });

  it('returns true for iPhone user agent', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    mockWindowWidth(375);
    expect(isMobileDevice()).toBe(true);
  });

  it('returns true for Android user agent', () => {
    mockUserAgent('Mozilla/5.0 (Linux; Android 11; Pixel 5)');
    mockWindowWidth(393);
    expect(isMobileDevice()).toBe(true);
  });

  it('returns true for iPad user agent', () => {
    mockUserAgent('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)');
    mockWindowWidth(768);
    expect(isMobileDevice()).toBe(true);
  });

  it('returns true for small screen with touch capability', () => {
    mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'); // desktop UA
    mockWindowWidth(500);
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });
    // ontouchstart must exist
    (window as any).ontouchstart = null;
    expect(isMobileDevice()).toBe(true);
    delete (window as any).ontouchstart;
  });

  it('returns false for small screen without touch capability', () => {
    mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    mockWindowWidth(500);
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        maxTouchPoints: 0,
      },
      writable: true,
      configurable: true,
    });
    delete (window as any).ontouchstart;
    expect(isMobileDevice()).toBe(false);
  });

  it('detects Opera Mini', () => {
    mockUserAgent('Opera/9.80 (J2ME/MIDP; Opera Mini/5.0.18741)');
    expect(isMobileDevice()).toBe(true);
  });

  it('detects BlackBerry', () => {
    mockUserAgent('Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)');
    expect(isMobileDevice()).toBe(true);
  });
});

describe('isMobileDevice - large desktop screen', () => {
  it('returns false for large screen with no touch and desktop UA', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        maxTouchPoints: 0,
      },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: 1920,
      writable: true,
      configurable: true,
    });
    delete (window as any).ontouchstart;

    const { isMobileDevice: freshCheck } = require('@/utils/deviceDetection');
    expect(freshCheck()).toBe(false);
  });
});
