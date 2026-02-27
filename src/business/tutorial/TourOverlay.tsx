import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import type { TutorialStep } from './types';

type Props = {
  open: boolean;
  steps: TutorialStep[];
  sectionTitle: string;
  onClose: () => void;
  onComplete: () => void;
};

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

const OVERLAY_Z = 120;
const SCROLL_MARGIN = 80;

const findRect = (selector: string): Rect | null => {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom,
  };
};

const isRectOutsideViewport = (rect: Rect) => {
  return (
    rect.top < SCROLL_MARGIN ||
    rect.bottom > window.innerHeight - SCROLL_MARGIN
  );
};

export function TourOverlay({
  open,
  steps,
  sectionTitle,
  onClose,
  onComplete,
}: Props) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!open) {
      setIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !step) return;

    const targetElement = document.querySelector(step.target);
    if (targetElement instanceof HTMLElement) {
      const currentRect = targetElement.getBoundingClientRect();
      if (
        isRectOutsideViewport({
          top: currentRect.top,
          left: currentRect.left,
          width: currentRect.width,
          height: currentRect.height,
          right: currentRect.right,
          bottom: currentRect.bottom,
        })
      ) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }

    const updateRect = () => {
      setTargetRect(findRect(step.target));
    };

    updateRect();
    const intervalId = window.setInterval(updateRect, 180);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [open, step]);

  const tooltipStyle = useMemo(() => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      } as const;
    }

    const viewportW = window.innerWidth;
    const tooltipWidth = Math.min(360, viewportW - 24);
    const left = Math.min(
      Math.max(12, targetRect.left + targetRect.width / 2 - tooltipWidth / 2),
      viewportW - tooltipWidth - 12
    );
    const placeAbove = targetRect.bottom + 220 > window.innerHeight;
    const top = placeAbove
      ? Math.max(12, targetRect.top - 196)
      : Math.min(window.innerHeight - 196, targetRect.bottom + 12);

    return {
      top,
      left,
      width: tooltipWidth,
      transform: 'none',
    } as const;
  }, [targetRect]);

  if (!open || !step || typeof document === 'undefined') return null;

  const isLast = index === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setIndex((prev) => Math.max(0, prev - 1));
  };

  return createPortal(
    <>
      {targetRect ? (
        <>
          <div
            className="fixed bg-black/55"
            style={{ zIndex: OVERLAY_Z, top: 0, left: 0, right: 0, height: targetRect.top }}
          />
          <div
            className="fixed bg-black/55"
            style={{
              zIndex: OVERLAY_Z,
              top: targetRect.top,
              left: 0,
              width: targetRect.left,
              height: targetRect.height,
            }}
          />
          <div
            className="fixed bg-black/55"
            style={{
              zIndex: OVERLAY_Z,
              top: targetRect.top,
              left: targetRect.right,
              right: 0,
              height: targetRect.height,
            }}
          />
          <div
            className="fixed bg-black/55"
            style={{ zIndex: OVERLAY_Z, top: targetRect.bottom, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="fixed rounded-xl border-2 border-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.4)] pointer-events-none"
            style={{
              zIndex: OVERLAY_Z + 1,
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/55" style={{ zIndex: OVERLAY_Z }} />
      )}

      <div
        className="fixed rounded-xl p-4 space-y-3 border border-emerald-300/70 bg-emerald-50/95 text-emerald-950"
        style={{ zIndex: OVERLAY_Z + 2, ...tooltipStyle }}
      >
        <div className="text-xs text-emerald-700/80">
          {sectionTitle} · Шаг {index + 1} из {steps.length}
        </div>
        <div>
          <h3 className="text-base font-semibold">{step.title}</h3>
          <p className="text-sm text-emerald-900/80 mt-1">{step.description}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Закрыть
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrev} disabled={index === 0}>
              Назад
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleNext}
            >
              {isLast ? 'Завершить' : 'Далее'}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
