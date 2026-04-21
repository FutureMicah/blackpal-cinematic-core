import "@testing-library/jest-dom";

// Default to mobile (375px) for responsive tests; individual tests can override.
Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 812 });

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: /max-width:\s*7\d\d/.test(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom lacks ResizeObserver / IntersectionObserver
class StubObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
(globalThis as any).ResizeObserver = StubObserver;
(globalThis as any).IntersectionObserver = StubObserver;

// Canvas getContext stub for chart components
(HTMLCanvasElement.prototype as any).getContext = () => ({
  scale: () => {}, clearRect: () => {}, beginPath: () => {}, moveTo: () => {},
  lineTo: () => {}, closePath: () => {}, fill: () => {}, stroke: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  fillRect: () => {}, strokeRect: () => {}, arc: () => {}, fillText: () => {},
  measureText: () => ({ width: 0 }),
});
