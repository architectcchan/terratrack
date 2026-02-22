"use client";

import { useState, useEffect } from "react";
import { Plus, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { ProductSheet } from "./product-sheet";
import type {
  ProductListItem,
  ProductCategory,
  StrainType,
  ProductStatus,
} from "@/types";
import {
  PRODUCT_STATUS_CONFIG,
  PRODUCT_CATEGORY_CONFIG,
  STRAIN_TYPE_CONFIG,
} from "@/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "flower", label: "Flower" },
  { value: "pre_roll", label: "Pre-Roll" },
  { value: "edible", label: "Edible" },
  { value: "vape", label: "Vape" },
  { value: "concentrate", label: "Concentrate" },
  { value: "topical", label: "Topical" },
  { value: "tincture", label: "Tincture" },
  { value: "accessory", label: "Accessory" },
  { value: "other", label: "Other" },
];

const STRAIN_TYPE_OPTIONS: { value: StrainType; label: string }[] = [
  { value: "indica", label: "Indica" },
  { value: "sativa", label: "Sativa" },
  { value: "hybrid", label: "Hybrid" },
  { value: "cbd", label: "CBD" },
  { value: "blend", label: "Blend" },
];

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "limited", label: "Limited" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "discontinued", label: "Discontinued" },
];

const NONE = "__none__";

// ─── Sort header ─────────────────────────────────────────────────────────────

function SortHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  className,
}: {
  label: string;
  field: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  className?: string;
}) {
  const active = sortBy === field;
  return (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap", className)}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active ? (
          sortOrder === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5 text-[#1B4332]" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-[#1B4332]" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />
        )}
      </div>
    </TableHead>
  );
}

// ─── THC range helper ────────────────────────────────────────────────────────

function formatTHCRange(min: string | null, max: string | null): string {
  const minVal = min ? parseFloat(min) : null;
  const maxVal = max ? parseFloat(max) : null;
  if (minVal === null && maxVal === null) return "—";
  if (minVal !== null && maxVal !== null && minVal !== maxVal) {
    return `${minVal}–${maxVal}%`;
  }
  return `${maxVal ?? minVal}%`;
}

// ─── Table view ──────────────────────────────────────────────────────────────

function ProductsTable({
  products,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
}: {
  products: ProductListItem[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onEdit: (p: ProductListItem) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <SortHeader
                label="Product"
                field="name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
                className="min-w-[220px]"
              />
              <SortHeader
                label="Category"
                field="category"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <TableHead>Strain</TableHead>
              <TableHead className="whitespace-nowrap">THC</TableHead>
              <SortHeader
                label="Wholesale"
                field="wholesalePrice"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <SortHeader
                label="MSRP"
                field="msrp"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <SortHeader
                label="Inventory"
                field="availableInventory"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <SortHeader
                label="Status"
                field="status"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const catKey = (product.category as ProductCategory) ?? "other";
              const catConfig = PRODUCT_CATEGORY_CONFIG[catKey];
              const statusKey = (product.status as ProductStatus) ?? "active";
              const statusConfig = PRODUCT_STATUS_CONFIG[statusKey];
              const thcRange = formatTHCRange(
                product.thcPercentMin,
                product.thcPercentMax,
              );

              return (
                <TableRow
                  key={product.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onEdit(product)}
                >
                  {/* Product name + SKU */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-md flex items-center justify-center shrink-0 text-lg",
                          product.imageUrl ? "overflow-hidden p-0" : catConfig.bg,
                        )}
                      >
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          catConfig.emoji
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-400">{product.sku}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    {product.category ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] border",
                          catConfig.badgeClass,
                        )}
                      >
                        {catConfig.label}
                      </Badge>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Strain type */}
                  <TableCell>
                    {product.strainType ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] border",
                          STRAIN_TYPE_CONFIG[product.strainType as StrainType]
                            .className,
                        )}
                      >
                        {
                          STRAIN_TYPE_CONFIG[product.strainType as StrainType]
                            .label
                        }
                      </Badge>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </TableCell>

                  {/* THC */}
                  <TableCell className="text-sm text-gray-700">
                    {thcRange}
                  </TableCell>

                  {/* Wholesale */}
                  <TableCell className="text-sm font-medium text-gray-900">
                    ${parseFloat(product.wholesalePrice).toFixed(2)}
                  </TableCell>

                  {/* MSRP */}
                  <TableCell className="text-sm text-gray-700">
                    {product.msrp
                      ? `$${parseFloat(product.msrp).toFixed(2)}`
                      : "—"}
                  </TableCell>

                  {/* Inventory */}
                  <TableCell>
                    {product.availableInventory === null ? (
                      <span className="text-gray-300 text-xs">—</span>
                    ) : product.availableInventory === 0 ? (
                      <span className="text-red-600 text-xs font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                        0
                      </span>
                    ) : product.availableInventory <= 10 ? (
                      <span className="text-amber-600 text-xs font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        {product.availableInventory}
                      </span>
                    ) : (
                      <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        {product.availableInventory}
                      </span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] border",
                        statusConfig.className,
                      )}
                    >
                      {statusConfig.label}
                    </Badge>
                  </TableCell>

                  {/* COA link */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {product.coaUrl && (
                      <a
                        href={product.coaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[#1B4332] transition-colors"
                        title="View COA"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd, filtered }: { onAdd: () => void; filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-3xl">
        📦
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {filtered ? "No products match your filters" : "No products yet"}
      </h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs">
        {filtered
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Add your first product to start building your catalog."}
      </p>
      {!filtered && (
        <Button
          onClick={onAdd}
          className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductsPageContent() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "table">("grid");

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [strainTypeFilter, setStrainTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Sort
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductListItem | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch products
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (categoryFilter) params.set("category", categoryFilter);
        if (strainTypeFilter) params.set("strain_type", strainTypeFilter);
        if (statusFilter) params.set("status", statusFilter);
        if (priceMin) params.set("price_min", priceMin);
        if (priceMax) params.set("price_max", priceMax);
        params.set("sort_by", sortBy);
        params.set("sort_order", sortOrder);
        params.set("limit", "200");

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();

        if (!cancelled) {
          setProducts(data.products ?? []);
          setTotal(data.total ?? 0);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearch,
    categoryFilter,
    strainTypeFilter,
    statusFilter,
    priceMin,
    priceMax,
    sortBy,
    sortOrder,
  ]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleOpenAdd = () => {
    setEditProduct(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (product: ProductListItem) => {
    setEditProduct(product);
    setSheetOpen(true);
  };

  const handleSaved = (savedProduct: ProductListItem) => {
    if (editProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)),
      );
    } else {
      setProducts((prev) => [savedProduct, ...prev]);
      setTotal((t) => t + 1);
    }
    setSheetOpen(false);
    setEditProduct(null);
  };

  const isFiltered =
    !!debouncedSearch ||
    !!categoryFilter ||
    !!strainTypeFilter ||
    !!statusFilter ||
    !!priceMin ||
    !!priceMax;

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Loading…" : `${total} product${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <Input
          placeholder="Search by name, SKU, or strain…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full sm:w-64 h-9 text-sm"
        />

        {/* Category filter */}
        <Select
          value={categoryFilter || NONE}
          onValueChange={(v) =>
            setCategoryFilter(v === NONE ? "" : v)
          }
        >
          <SelectTrigger className="h-9 w-full sm:w-36 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>All categories</SelectItem>
            {CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Strain type filter */}
        <Select
          value={strainTypeFilter || NONE}
          onValueChange={(v) =>
            setStrainTypeFilter(v === NONE ? "" : v)
          }
        >
          <SelectTrigger className="h-9 w-full sm:w-36 text-sm">
            <SelectValue placeholder="Strain type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>All strains</SelectItem>
            {STRAIN_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter || NONE}
          onValueChange={(v) =>
            setStatusFilter(v === NONE ? "" : v)
          }
        >
          <SelectTrigger className="h-9 w-full sm:w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price range */}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="Min $"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="h-9 w-20 text-sm"
            min={0}
          />
          <span className="text-gray-400 text-xs">–</span>
          <Input
            type="number"
            placeholder="Max $"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="h-9 w-20 text-sm"
            min={0}
          />
        </div>

        {/* Clear filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-sm text-gray-500"
            onClick={() => {
              setSearchInput("");
              setDebouncedSearch("");
              setCategoryFilter("");
              setStrainTypeFilter("");
              setStatusFilter("");
              setPriceMin("");
              setPriceMax("");
            }}
          >
            Clear filters
          </Button>
        )}

        {/* View toggle — pushed to right */}
        <div className="ml-auto flex items-center bg-gray-100 rounded-md p-0.5">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              view === "grid"
                ? "bg-white shadow-sm text-[#1B4332]"
                : "text-gray-400 hover:text-gray-600",
            )}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              view === "table"
                ? "bg-white shadow-sm text-[#1B4332]"
                : "text-gray-400 hover:text-gray-600",
            )}
            title="Table view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : ""
          }
        >
          {view === "grid"
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 animate-pulse rounded-lg h-64"
                />
              ))
            : Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 animate-pulse rounded h-10 mb-2"
                />
              ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState onAdd={handleOpenAdd} filtered={isFiltered} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onEdit={handleOpenEdit} />
          ))}
        </div>
      ) : (
        <ProductsTable
          products={products}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEdit={handleOpenEdit}
        />
      )}

      {/* Add / Edit sheet */}
      <ProductSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditProduct(null);
        }}
        product={editProduct}
        onSaved={handleSaved}
      />
    </div>
  );
}
