import type { BurgerLayerConfig } from './burgerLayers';
import styles from './ExplodedBurgerSection.module.css';

type BurgerLayerProps = { layer: BurgerLayerConfig; register: (element: HTMLDivElement | null, id: string) => void };

export default function BurgerLayer({ layer, register }: BurgerLayerProps) {
  return (
    <div ref={(element) => register(element, layer.id)} className={styles.motionLayer} style={{ zIndex: layer.zIndex }} data-layer={layer.id}>
      <div className={styles.parallaxLayer}>
        <img className={styles.ingredientImage} src={layer.src} alt="" width={1024} height={1024} draggable={false} />
      </div>
    </div>
  );
}
