import React from 'react';

type Props = {
  title: string;
  bannerUrl?: string;
  address?: string;
  workTimeText?: string;
};

export const CatalogHeader: React.FunctionComponent<Props> = ({
  title,
  bannerUrl,
  address,
  workTimeText,
}) => {
  return (
    <div className="relative h-52">
      {!bannerUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/65 to-primary" />
      )}
      {bannerUrl && (
        <img
          src={bannerUrl}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="rounded-2xl border border-white/30 bg-white/15 backdrop-blur-md p-4 text-white shadow-lg">
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
          {(address || workTimeText) && (
            <div className="mt-2 text-sm opacity-95 space-y-1">
              {address && <p>{address}</p>}
              {workTimeText && <p>{workTimeText}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
