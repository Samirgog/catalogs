import { Button } from '@/components/ui/button';
import React, { useEffect, useRef, useState } from 'react';

type Props = {
  categories: { id: string; title: string }[];
};

export const CategoryTabs: React.FunctionComponent<Props> = ({
  categories,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0]?.id || ''
  );
  const releaseScrollSyncTimeoutRef = useRef<number | null>(null);
  const isAutoScrollingRef = useRef(false);
  const resolvedActiveCategory = categories.some(c => c.id === activeCategory)
    ? activeCategory
    : categories[0]?.id || '';

  const getStickyOffset = () => {
    const tabsElement = document.getElementById('category-tabs');
    return (tabsElement?.offsetHeight ?? 0) + 8;
  };

  const scrollTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    const offset = getStickyOffset();
    const top = target.getBoundingClientRect().top + window.scrollY - offset;

    isAutoScrollingRef.current = true;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveCategory(id);

    if (releaseScrollSyncTimeoutRef.current) {
      window.clearTimeout(releaseScrollSyncTimeoutRef.current);
    }
    releaseScrollSyncTimeoutRef.current = window.setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 450);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!categories.length) return;

      const offset = getStickyOffset();
      const viewportTop = window.scrollY + offset;
      let current = categories[0].id;

      for (const category of categories) {
        const section = document.getElementById(category.id);
        if (!section) continue;
        if (section.offsetTop <= viewportTop) {
          current = category.id;
        } else {
          break;
        }
      }

      if (!isAutoScrollingRef.current) {
        setActiveCategory(current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (releaseScrollSyncTimeoutRef.current) {
        window.clearTimeout(releaseScrollSyncTimeoutRef.current);
      }
    };
  }, [categories]);

  return (
    <div
      id="category-tabs"
      className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border/20"
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(c => (
          <Button
            key={c.id}
            variant={resolvedActiveCategory === c.id ? 'default' : 'secondary'}
            size="sm"
            className="rounded-full px-4"
            onClick={() => scrollTo(c.id)}
          >
            {c.title}
          </Button>
        ))}
      </div>
    </div>
  );
};
