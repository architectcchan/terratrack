"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ProductListItem,
  ProductCategory,
  StrainType,
  ProductStatus,
} from "@/types";
import {
  PRODUCT_CATEGORY_CONFIG,
  PRODUCT_STATUS_CONFIG,
  STRAIN_TYPE_CONFIG,
} from "@/types";

interface ProductCardProps {
  product: ProductListItem;
  onEdit: (product: ProductListItem) => void;
}

function formatTHCRange(min: string | null, max: string | null): string | null {
  const minVal = min ? parseFloat(min) : null;
  const maxVal = max ? parseFloat(max) : null;
  if (minVal === null && maxVal === null) return null;
  if (minVal !== null && maxVal !== null && minVal !== maxVal) {
    return `${minVal}–${maxVal}% THC`;
  }
  const val = maxVal ?? minVal;
  return `${val}% THC`;
}

function InventoryIndicator({
  count,
}: {
  count: number | null;
}) {
  if (count === null) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
        No data
      </div>
    );
  }
  if (count === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-600">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        Out of stock
      </div>
    );
  }
  if (count <= 10) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600">
        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
        Low stock ({count})
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
      {count} in stock
    </div>
  );
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
  const catKey = (product.category as ProductCategory) ?? "other";
  const catConfig = PRODUCT_CATEGORY_CONFIG[catKey];
  const statusKey = (product.status as ProductStatus) ?? "active";
  const statusConfig = PRODUCT_STATUS_CONFIG[statusKey];
  const thcRange = formatTHCRange(product.thcPercentMin, product.thcPercentMax);

  return (
    <div
      onClick={() => onEdit(product)}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-150 group flex flex-col"
    >
      {/* Image / Placeholder */}
      <div
        className={cn(
          "relative h-40 flex items-center justify-center overflow-hidden",
          product.imageUrl ? "" : catConfig.bg,
        )}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <span className={cn("text-5xl select-none", catConfig.textColor)}>
            {catConfig.emoji}
          </span>
        )}

        {/* Status badge pinned to top-right */}
        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-medium border",
              statusConfig.className,
            )}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Name + SKU */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
        </div>

        {/* Category + Strain badges */}
        <div className="flex flex-wrap gap-1">
          {product.category && (
            <Badge
              variant="outline"
              className={cn("text-[11px] border", catConfig.badgeClass)}
            >
              {catConfig.label}
            </Badge>
          )}
          {product.strainType && (
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] border",
                STRAIN_TYPE_CONFIG[product.strainType as StrainType].className,
              )}
            >
              {STRAIN_TYPE_CONFIG[product.strainType as StrainType].label}
            </Badge>
          )}
        </div>

        {/* THC range */}
        {thcRange && (
          <p className="text-xs font-medium text-gray-700">{thcRange}</p>
        )}

        {/* Pricing */}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
          <span>
            <span className="text-gray-400">Wholesale </span>
            <span className="font-semibold text-gray-800">
              ${parseFloat(product.wholesalePrice).toFixed(2)}
            </span>
          </span>
          {product.msrp && (
            <span>
              <span className="text-gray-400">MSRP </span>
              <span className="font-semibold text-gray-800">
                ${parseFloat(product.msrp).toFixed(2)}
              </span>
            </span>
          )}
        </div>

        {/* Inventory */}
        <InventoryIndicator count={product.availableInventory} />
      </div>
    </div>
  );
}
