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
      {bannerUrl && (
        <img
          src={bannerUrl}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-4 left-4 text-white">
        <h1 className="text-3xl font-bold">{title}</h1>
        {(address || workTimeText) && (
          <div className="mt-2 text-sm opacity-95">
            {address && <p>{address}</p>}
            {workTimeText && <p>{workTimeText}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
