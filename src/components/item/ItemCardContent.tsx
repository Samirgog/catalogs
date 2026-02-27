import type { ReactNode } from 'react';

type Props = {
  imageUrl?: string;
  imageAlt?: string;
  title?: string;
  description?: string;
  price?: number;
  fallbackImage?: ReactNode;
  actions?: ReactNode;
  showPrice?: boolean;
  imageClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  priceClassName?: string;
};

export function ItemCardContent({
  imageUrl,
  imageAlt,
  title,
  description,
  price,
  fallbackImage,
  actions,
  showPrice,
  imageClassName = 'h-20 w-20 rounded-xl object-cover',
  titleClassName = 'font-medium',
  descriptionClassName = 'font-normal text-muted-foreground text-xs',
  priceClassName = 'font-semibold text-base',
}: Props) {
  return (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          className={imageClassName}
          alt={imageAlt || title || 'item-image'}
        />
      ) : (
        fallbackImage || null
      )}

      <div className="flex flex-1 flex-col">
        <div className="flex flex-col">
          <h3 className={titleClassName}>{title}</h3>
          {description && <h5 className={descriptionClassName}>{description}</h5>}
        </div>
        {(showPrice ?? typeof price === 'number') && (
          <div className="mt-3">
            <div className={priceClassName}>{price} ₽</div>
          </div>
        )}
        {actions}
      </div>
    </>
  );
}
