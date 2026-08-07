'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import BurgerLayer from './BurgerLayer';
import { burgerLayers } from './burgerLayers';
import styles from './ExplodedBurgerSection.module.css';

type Props = { eyebrow?: string; heading?: string; description?: string; buttonLabel?: string; onButtonClick?: () => void };

export default function ExplodedBurgerSection({
  eyebrow = 'Crafted Fresh', heading = 'Every Layer Matters',
  description = 'Premium ingredients, carefully stacked for the perfect bite.',
  buttonLabel = 'Explore the Menu', onButtonClick,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef(new Map<string, HTMLDivElement>());
  const registerLayer = useCallback((element: HTMLDivElement | null, id: string) => {
    if (element) layerRefs.current.set(id, element); else layerRefs.current.delete(id);
  }, []);

  useLayoutEffect(() => {
    if (!sectionRef.current || !burgerRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    const burger = burgerRef.current;
    const content = contentRef.current;
    const shadow = shadowRef.current;
    const hint = hintRef.current;

    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(burger, { opacity: 1, y: 0, scale: 1, filter: 'none' });
        gsap.set([...layerRefs.current.values()], { x: 0, y: 0, rotation: 0, scale: 1 });
        gsap.set(content, { opacity: 1, y: 0 });
        gsap.set(hint, { opacity: 0 });
      });

      media.add('(prefers-reduced-motion: no-preference)', () => {
        const buildTimeline = (mobile: boolean) => {
          const distanceScale = window.innerWidth < 390 ? 0.86 : 1;
          const timeline = gsap.timeline({
            defaults: { ease: 'power2.inOut', force3D: true },
            scrollTrigger: {
              trigger: section, start: 'top top',
              end: () => `+=${Math.round(window.innerHeight * (mobile ? 2.8 : 3.35))}`,
              pin: true, scrub: mobile ? 0.9 : 1.15, anticipatePin: 1, invalidateOnRefresh: true,
            },
          });
          gsap.set(content, { opacity: 0, y: 28 });
          gsap.set(shadow, { opacity: 0.15, scaleX: 0.72 });
          timeline
            .addLabel('enter', 0)
            .fromTo(burger, { y: mobile ? '62svh' : '70vh', scale: 0.82, opacity: 0, filter: mobile ? 'blur(3px)' : 'blur(8px)' }, { y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 15, ease: 'power3.out' }, 0)
            .to(hint, { opacity: 0, duration: 4 }, 3)
            .addLabel('explode', 15);

          [...burgerLayers].reverse().forEach((layer, index) => {
            const element = layerRefs.current.get(layer.id);
            if (!element) return;
            timeline.to(element, {
              y: (mobile ? layer.mobileExplodedY : layer.desktopExplodedY) * distanceScale,
              x: layer.explodedX * (mobile ? 0.62 : 1), rotation: layer.rotation, scale: layer.scale,
              duration: 7.2, ease: 'power2.out',
            }, 15 + index * 3.7);
          });

          timeline.addLabel('hold', 52)
            .to(burger, { y: mobile ? -7 : -12, duration: 16, ease: 'sine.inOut' }, 52)
            .to(shadow, { opacity: 0.3, scaleX: 1, duration: 10 }, 54)
            .addLabel('assemble', 68);

          burgerLayers.forEach((layer, index) => {
            const element = layerRefs.current.get(layer.id);
            if (!element) return;
            timeline.to(element, { y: 0, x: 0, rotation: 0, scale: 1, duration: 6 }, 68 + index * 2.25);
          });
          timeline.addLabel('settle', 88)
            .to(burger, { y: mobile ? 12 : 20, duration: 12, ease: 'power2.out' }, 88)
            .to(shadow, { opacity: 0.58, scaleX: 1.08, duration: 12, ease: 'power2.out' }, 88)
            .to(content, { opacity: 1, y: 0, duration: 9, ease: 'power2.out' }, 91);
          return () => timeline.scrollTrigger?.kill();
        };
        media.add('(min-width: 769px)', () => buildTimeline(false));
        media.add('(max-width: 768px)', () => buildTimeline(true));
      });

      const images = [...section.querySelectorAll('img')];
      void Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      }))).then(() => ScrollTrigger.refresh());
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener('orientationchange', refresh);
      return () => { window.removeEventListener('orientationchange', refresh); media.revert(); };
    }, section);
    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} aria-label="An animated burger showing its ingredients separating and assembling while scrolling">
      <div className={styles.ambientGlow} /><div className={styles.vignette} />
      <div className={styles.layout}>
        <div ref={contentRef} className={styles.content}>
          <p className={styles.eyebrow}>{eyebrow}</p><h1 className={styles.heading}>{heading}</h1>
          <p className={styles.description}>{description}</p>
          <button type="button" className={styles.button} onClick={onButtonClick}>{buttonLabel}</button>
        </div>
        <div className={styles.visualColumn}>
          <div ref={burgerRef} className={styles.burgerStage}>
            {burgerLayers.map((layer) => <BurgerLayer key={layer.id} layer={layer} register={registerLayer} />)}
          </div>
          <div ref={shadowRef} className={styles.burgerShadow} />
          <div ref={hintRef} className={styles.scrollHint} aria-hidden="true"><span className={styles.scrollLine} />Scroll to explore</div>
        </div>
      </div>
    </section>
  );
}
