import { useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '@/useTelegramAuth';
import {
  consumeForcedTutorialSection,
  isTutorialDismissedThisSession,
  isTutorialSeen,
  markTutorialSeen,
} from './storage';
import type { TutorialSectionId, TutorialStep } from './types';

type Options = {
  enabled?: boolean;
};

export const useSectionTutorial = (
  sectionId: TutorialSectionId,
  steps: TutorialStep[],
  options?: Options
) => {
  const enabled = options?.enabled ?? true;
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUser();
  const userKey = user?.id || user?.telegram_id || null;
  const hasSteps = steps.length > 0;

  const canAutoStart = useMemo(
    () => Boolean(enabled && hasSteps && userKey),
    [enabled, hasSteps, userKey]
  );

  useEffect(() => {
    if (!canAutoStart) return;

    const forced = consumeForcedTutorialSection(sectionId);
    if (forced) {
      setOpen(true);
      return;
    }

    if (
      isTutorialSeen(String(userKey), sectionId) ||
      isTutorialDismissedThisSession(String(userKey), sectionId)
    ) {
      return;
    }
    const timerId = window.setTimeout(() => setOpen(true), 280);
    return () => window.clearTimeout(timerId);
  }, [canAutoStart, sectionId, userKey]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ sectionId?: TutorialSectionId }>;
      if (customEvent.detail?.sectionId !== sectionId) return;
      setOpen(true);
    };

    window.addEventListener('business:tutorial:open', handler);
    return () => window.removeEventListener('business:tutorial:open', handler);
  }, [sectionId]);

  const closeAndMarkSeen = () => {
    if (userKey) {
      markTutorialSeen(String(userKey), sectionId);
    }
    setOpen(false);
  };

  const complete = () => {
    if (userKey) {
      markTutorialSeen(String(userKey), sectionId);
    }
    setOpen(false);
  };

  const start = () => setOpen(true);

  return {
    open,
    start,
    closeAndMarkSeen,
    complete,
  };
};
