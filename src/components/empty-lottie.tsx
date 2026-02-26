import { useEffect } from 'react';
import { createElement } from 'react';

type Props = {
  src: string;
  className?: string;
};

export function EmptyLottie({ src, className }: Props) {
  useEffect(() => {
    const scriptId = 'dotlottie-player-script';
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs';
    script.type = 'module';
    document.body.appendChild(script);
  }, []);

  return createElement('dotlottie-player' as any, {
    src,
    autoplay: true,
    loop: true,
    class: className || 'w-48 h-48',
  });
}
