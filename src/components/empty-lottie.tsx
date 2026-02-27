import { DotLottieReact } from '@lottiefiles/dotlottie-react';

type Props = {
  src: string;
  className?: string;
};

export function EmptyLottie({ src, className }: Props) {
  return <DotLottieReact src={src} autoplay loop className={className || 'w-48 h-48'} />;
}
