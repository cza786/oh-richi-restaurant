export type BurgerLayerConfig = {
  id: string;
  name: string;
  src: string;
  zIndex: number;
  desktopExplodedY: number;
  mobileExplodedY: number;
  explodedX: number;
  rotation: number;
  scale: number;
};

export const burgerLayers: BurgerLayerConfig[] = [
  { id: 'bun-top', name: 'Top bun', src: '/burger/bun-top.webp', zIndex: 90, desktopExplodedY: -220, mobileExplodedY: -135, explodedX: 2, rotation: 1.2, scale: 1 },
  { id: 'lettuce-top', name: 'Upper lettuce', src: '/burger/lettuce-top.webp', zIndex: 80, desktopExplodedY: -165, mobileExplodedY: -102, explodedX: -10, rotation: -2.4, scale: 1.01 },
  { id: 'tomato', name: 'Tomato', src: '/burger/tomato.webp', zIndex: 70, desktopExplodedY: -115, mobileExplodedY: -72, explodedX: 12, rotation: 2.8, scale: 0.99 },
  { id: 'onion', name: 'Onion', src: '/burger/onion.webp', zIndex: 60, desktopExplodedY: -70, mobileExplodedY: -43, explodedX: -8, rotation: -3.2, scale: 1.02 },
  { id: 'cheese-top', name: 'Upper cheese', src: '/burger/cheese-top.webp', zIndex: 50, desktopExplodedY: -25, mobileExplodedY: -15, explodedX: 9, rotation: 2, scale: 1.01 },
  { id: 'cheese-bottom', name: 'Lower cheese', src: '/burger/cheese-bottom.webp', zIndex: 40, desktopExplodedY: 25, mobileExplodedY: 15, explodedX: -7, rotation: -1.8, scale: 0.99 },
  { id: 'patty', name: 'Beef patty', src: '/burger/patty.webp', zIndex: 30, desktopExplodedY: 75, mobileExplodedY: 48, explodedX: 5, rotation: 0.8, scale: 1 },
  { id: 'lettuce-bottom', name: 'Lower lettuce', src: '/burger/lettuce-bottom.webp', zIndex: 20, desktopExplodedY: 135, mobileExplodedY: 85, explodedX: -11, rotation: -2.2, scale: 1.01 },
  { id: 'bun-bottom', name: 'Bottom bun', src: '/burger/bun-bottom.webp', zIndex: 10, desktopExplodedY: 200, mobileExplodedY: 125, explodedX: 1, rotation: -0.8, scale: 1 },
];
