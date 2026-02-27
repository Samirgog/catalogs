import type { TutorialSectionId } from './types';

const FORCE_TUTORIAL_SECTION_KEY = 'business:tutorial:forced-section';

export const buildTutorialSeenKey = (userId: string, sectionId: TutorialSectionId) =>
  `business:tutorial:seen:${userId}:${sectionId}`;

export const isTutorialSeen = (userId: string, sectionId: TutorialSectionId) => {
  try {
    return localStorage.getItem(buildTutorialSeenKey(userId, sectionId)) === '1';
  } catch {
    return false;
  }
};

export const markTutorialSeen = (userId: string, sectionId: TutorialSectionId) => {
  try {
    localStorage.setItem(buildTutorialSeenKey(userId, sectionId), '1');
  } catch {
    // no-op
  }
};

export const setForcedTutorialSection = (sectionId: TutorialSectionId) => {
  try {
    sessionStorage.setItem(FORCE_TUTORIAL_SECTION_KEY, sectionId);
  } catch {
    // no-op
  }
  window.dispatchEvent(
    new CustomEvent('business:tutorial:open', {
      detail: { sectionId },
    })
  );
};

export const consumeForcedTutorialSection = (sectionId: TutorialSectionId) => {
  try {
    const stored = sessionStorage.getItem(FORCE_TUTORIAL_SECTION_KEY);
    if (stored !== sectionId) return false;
    sessionStorage.removeItem(FORCE_TUTORIAL_SECTION_KEY);
    return true;
  } catch {
    return false;
  }
};
