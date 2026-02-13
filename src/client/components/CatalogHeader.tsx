import React from 'react';

type Props = {
    title: string;
    bannerUrl?: string;
}

export const CatalogHeader: React.FunctionComponent<Props> = ({title, bannerUrl}) => {
  return (
    <div className="relative h-52">
        {bannerUrl && (
            <img
                src="https://images.unsplash.com/photo-1528605248644-14dd04022da1"
                className="absolute inset-0 h-full w-full object-cover"
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
        <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-sm opacity-90">Кофе и десерты</p>
      </div>
    </div>
  );
}