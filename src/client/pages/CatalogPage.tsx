import React from "react";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockCatalog } from "../../__mocks__/client/catalogs";
import { useCartStore } from "../stores/cart";
import { CatalogHeader, CategorySection, CategoryTabs } from "../components";
import { type CatalogType } from "../../types";

export const CatalogPage: React.FunctionComponent = () => {
    const navigate = useNavigate();
    const {data, isLoading, error} = {data: mockCatalog, isLoading: false, error: false};
    const { getTotalItems, getTotalPrice } = useCartStore();
    
    const businessType: CatalogType = 'goods';

    if (isLoading) return <div className="p-4">Загрузка…</div>;
    if (error) return <div className="p-4">Ошибка</div>;
    if (!data) return null;

    const catalog = data.catalogs[0];
    const itemsCount = getTotalItems();
    const total = getTotalPrice();

    const handleGoToCart = () => {
        navigate("/cart")
    }

    return (
        <div className="min-h-screen bg-background">
            <CatalogHeader
                title={data.title}
                bannerUrl={data.banner_url}
            />

            <CategoryTabs
                categories={catalog.categories.map((c) => ({
                    id: c.id,
                    title: c.title,
                }))}
            />

            <div className="p-4 space-y-6 pb-28">
                {catalog.categories.map((c) => (
                    <CategorySection
                        key={c.id}
                        id={c.id}
                        title={c.title}
                        items={c.items as any}
                        businessType={businessType}
                    />
                ))}
            </div>

            {itemsCount > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-50">
                    <button
                        onClick={handleGoToCart}
                        className="
                            w-full h-14
                            rounded-2xl
                            bg-primary
                            text-primary-foreground
                            flex items-center justify-between
                            px-5
                          "
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                                <ShoppingCart size={18} />
                            </div>
                            <span className="font-medium">
                                Корзина · {itemsCount}
                            </span>
                        </div>

                        <span className="text-lg font-semibold">
                            {total} ₽
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
