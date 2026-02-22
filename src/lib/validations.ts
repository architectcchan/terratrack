import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  dbaName: z.string().max(255).nullish(),
  addressLine1: z.string().min(1, "Address is required").max(255),
  addressLine2: z.string().max(255).nullish(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().length(2).default("WA"),
  zip: z.string().min(5, "ZIP code is required").max(10),
  phone: z.string().max(20).nullish(),
  email: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().email("Invalid email").max(255).nullable().optional(),
  ),
  website: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().url("Invalid URL").max(500).nullable().optional(),
  ),
  licenseNumber: z.string().max(100).nullish(),
  licenseType: z
    .enum(["retailer", "microbusiness", "delivery", "consumption_lounge", "other"])
    .default("retailer"),
  licenseExpiration: z.string().nullish(),
  status: z
    .enum(["prospect", "sample_sent", "active", "at_risk", "dormant", "churned"])
    .default("prospect"),
  revenueTier: z.enum(["A", "B", "C", "D", "unranked"]).default("unranked"),
  assignedRepId: z.string().uuid().nullish(),
  territoryId: z.string().uuid().nullish(),
  chainId: z.string().uuid().nullish(),
  paymentTerms: z
    .enum(["cod", "net_15", "net_30", "net_45", "custom"])
    .default("cod"),
  notes: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  googlePlaceId: z.string().max(255).nullish(),
  latitude: z.string().nullish(),
  longitude: z.string().nullish(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

// ─── Products ────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(50),
  category: z
    .enum([
      "flower",
      "pre_roll",
      "edible",
      "vape",
      "concentrate",
      "topical",
      "tincture",
      "accessory",
      "other",
    ])
    .nullish(),
  subcategory: z.string().max(100).nullish(),
  status: z
    .enum(["active", "limited", "out_of_stock", "discontinued"])
    .default("active"),
  strainName: z.string().max(100).nullish(),
  strainType: z
    .enum(["indica", "sativa", "hybrid", "cbd", "blend"])
    .nullish(),
  description: z.string().nullish(),
  thcPercentMin: z.string().nullish(),
  thcPercentMax: z.string().nullish(),
  cbdPercentMin: z.string().nullish(),
  cbdPercentMax: z.string().nullish(),
  growType: z.string().max(100).nullish(),
  turnaroundTime: z.string().max(100).nullish(),
  minimumOrder: z.string().max(100).nullish(),
  wholesalePrice: z.string().min(1, "Wholesale price is required"),
  msrp: z.string().nullish(),
  availableInventory: z.string().nullish(),
  unitSize: z.string().min(1, "Unit size is required").max(50),
  imageUrl: z.string().url().max(500).nullish(),
  coaUrl: z.string().url().max(500).nullish(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orderLineItemSchema = z.object({
  productId: z.string().uuid("Product is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.string().min(1, "Unit price is required"),
  discountPercent: z.string().default("0"),
  notes: z.string().nullish(),
});

export const createOrderSchema = z.object({
  accountId: z.string().uuid("Account is required"),
  repId: z.string().uuid().nullish(),
  stage: z
    .enum([
      "lead",
      "quote_sent",
      "confirmed",
      "processing",
      "ready_for_delivery",
      "delivered",
      "paid",
      "lost",
      "cancelled",
    ])
    .default("lead"),
  source: z
    .enum([
      "in_person",
      "phone",
      "text",
      "email",
      "leaflink",
      "growflow",
      "nabis",
      "distru",
      "other",
    ])
    .default("in_person"),
  expectedCloseDate: z.string().nullish(),
  paymentTerms: z
    .enum(["cod", "net_15", "net_30", "net_45", "custom"])
    .default("cod"),
  linkedVisitId: z.string().uuid().nullish(),
  linkedSampleId: z.string().uuid().nullish(),
  notes: z.string().nullish(),
  lineItems: z
    .array(orderLineItemSchema)
    .min(1, "At least one line item is required"),
});

export const moveOrderSchema = z.object({
  stage: z.enum([
    "lead",
    "quote_sent",
    "confirmed",
    "processing",
    "ready_for_delivery",
    "delivered",
    "paid",
    "lost",
    "cancelled",
  ]),
  lossReason: z
    .enum([
      "price",
      "competitor",
      "out_of_stock",
      "no_response",
      "quality",
      "shelf_full",
      "other",
    ])
    .nullish(),
  notes: z.string().nullish(),
});

export const updateOrderSchema = z.object({
  expectedCloseDate: z.string().nullish(),
  actualCloseDate: z.string().nullish(),
  deliveryDate: z.string().nullish(),
  paymentStatus: z.enum(["unpaid", "partial", "paid", "overdue"]).optional(),
  paymentTerms: z
    .enum(["cod", "net_15", "net_30", "net_45", "custom"])
    .optional(),
  notes: z.string().nullish(),
  source: z
    .enum([
      "in_person",
      "phone",
      "text",
      "email",
      "leaflink",
      "growflow",
      "nabis",
      "distru",
      "other",
    ])
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type MoveOrderInput = z.infer<typeof moveOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  taskType: z
    .enum([
      "follow_up_visit",
      "reorder_check",
      "send_menu",
      "budtender_training",
      "sample_follow_up",
      "vendor_day_prep",
      "manager_assigned",
      "custom",
    ])
    .nullish(),
  description: z.string().nullish(),
  accountId: z.string().uuid().nullish(),
  assignedTo: z.string().uuid("Assigned user is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  linkedVisitId: z.string().uuid().nullish(),
  linkedOrderId: z.string().uuid().nullish(),
  linkedSampleId: z.string().uuid().nullish(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  taskType: z
    .enum([
      "follow_up_visit",
      "reorder_check",
      "send_menu",
      "budtender_training",
      "sample_follow_up",
      "vendor_day_prep",
      "manager_assigned",
      "custom",
    ])
    .nullish(),
  description: z.string().nullish(),
  accountId: z.string().uuid().nullish(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
  linkedVisitId: z.string().uuid().nullish(),
  linkedOrderId: z.string().uuid().nullish(),
  linkedSampleId: z.string().uuid().nullish(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
