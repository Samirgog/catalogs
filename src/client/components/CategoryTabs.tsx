import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from 'react';

type Props = {
  categories: { id: string; title: string }[];
};

export const CategoryTabs: React.FunctionComponent<Props> = ({ categories }) => {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveCategory(id);
  };

  // Monitor scroll position to highlight the current section
  useEffect(() => {
    const handleScroll = () => {
      // Find the section that is currently in the viewport
      const sections = categories.map(cat => document.getElementById(cat.id));
      
      // Find the section that is closest to the top of the viewport
      let closestSectionId = categories[0]?.id || '';
      let smallestTop = Infinity;
      
      sections.forEach((section, index) => {
        if (section) {
          const rect = section.getBoundingClientRect();
          // Consider the section that is closest to the top of the viewport as active
          if (rect.top <= 100 && rect.bottom >= 100) { // 100px offset to account for sticky header
            closestSectionId = categories[index].id;
          } else if (rect.top > 100 && rect.top < smallestTop) {
            smallestTop = rect.top;
            closestSectionId = categories[index].id;
          }
        }
      });
      
      setActiveCategory(closestSectionId);
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [categories]);

  return (
    <div className="Sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border/20">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <Button
            key={c.id}
            variant={activeCategory === c.id ? "default" : "secondary"}
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
}
