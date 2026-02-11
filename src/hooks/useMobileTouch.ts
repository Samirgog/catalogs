import { useState, useRef } from 'react';

interface TouchHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  isPressed: boolean;
}

/**
 * Hook for improved mobile touch handling
 * Provides consistent touch events across different devices
 */
export const useMobileTouch = (): TouchHandlers => {
  const [isPressed, setIsPressed] = useState(false);
  const touchStartTime = useRef<number>(0);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onTouchStart = (e: React.TouchEvent) => {
    // Prevent default to avoid unwanted behaviors
    e.preventDefault();
    
    // Track touch start time and position
    touchStartTime.current = Date.now();
    const touch = e.touches[0];
    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    setIsPressed(true);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime.current;
    
    // Consider it a tap if touch lasted less than 300ms
    if (touchDuration < 300) {
      // Simulate click event for better compatibility
      const touch = e.changedTouches[0];
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      
      // Dispatch the click event on the target element
      if (e.target) {
        (e.target as HTMLElement).dispatchEvent(clickEvent);
      }
    }
    
    setIsPressed(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // Prevent scrolling during touch interactions
    e.preventDefault();
  };

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    isPressed
  };
};

/**
 * Hook for enhanced button touch interactions
 */
export const useButtonTouch = (onClick?: () => void) => {
  const { onTouchStart, onTouchEnd, onTouchMove, isPressed } = useMobileTouch();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
  };

  return {
    onTouchStart,
    onTouchEnd: (e: React.TouchEvent) => {
      onTouchEnd(e);
      // Also trigger click on touch end for immediate feedback
      if (onClick) {
        onClick();
      }
    },
    onTouchMove,
    onMouseDown: handleClick,
    isPressed
  };
};