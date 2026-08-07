'use client';

import ExplodedBurgerSection from './burger-animation/ExplodedBurgerSection';

type HeroSectionProps = { onOrderClick: () => void; onExploreClick: () => void };

export default function HeroSection({ onOrderClick, onExploreClick }: HeroSectionProps) {
  const handleExplore = onExploreClick || onOrderClick;
  return (
    <ExplodedBurgerSection
      eyebrow="Crafted Fresh"
      heading="Every Layer Matters"
      description="Premium ingredients, carefully stacked and flame-grilled for the perfect bite."
      buttonLabel="Explore the Menu"
      onButtonClick={handleExplore}
    />
  );
}
