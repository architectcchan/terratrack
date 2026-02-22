import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "sales_manager",
  "sales_rep",
]);

export const userStatusEnum = pgEnum("user_status", [
  "invited",
  "active",
  "inactive",
]);

export const licenseTypeEnum = pgEnum("license_type", [
  "retailer",
  "microbusiness",
  "delivery",
  "consumption_lounge",
  "other",
]);

export const accountStatusEnum = pgEnum("account_status", [
  "prospect",
  "sample_sent",
  "active",
  "at_risk",
  "dormant",
  "churned",
]);

export const revenueTierEnum = pgEnum("revenue_tier", [
  "A",
  "B",
  "C",
  "D",
  "unranked",
]);

export const paymentTermsEnum = pgEnum("payment_terms", [
  "cod",
  "net_15",
  "net_30",
  "net_45",
  "custom",
]);

export const contactRoleEnum = pgEnum("contact_role", [
  "buyer",
  "store_manager",
  "assistant_manager",
  "budtender",
  "owner",
  "other",
]);

export const preferredContactMethodEnum = pgEnum("preferred_contact_method", [
  "phone",
  "email",
  "text",
  "in_person",
]);

export const productCategoryEnum = pgEnum("product_category", [
  "flower",
  "pre_roll",
  "edible",
  "vape",
  "concentrate",
  "topical",
  "tincture",
  "accessory",
  "other",
]);

export const strainTypeEnum = pgEnum("strain_type", [
  "indica",
  "sativa",
  "hybrid",
  "cbd",
  "blend",
]);

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "limited",
  "out_of_stock",
  "discontinued",
]);

export const visitTypeEnum = pgEnum("visit_type", [
  "scheduled_meeting",
  "drop_in",
  "delivery",
  "budtender_training",
  "sample_drop",
  "vendor_day",
  "popup_event",
  "other",
]);

export const visitOutcomeEnum = pgEnum("visit_outcome", [
  "order_placed",
  "reorder_confirmed",
  "sample_left",
  "follow_up_needed",
  "no_decision",
  "buyer_unavailable",
  "declined",
  "other",
]);

export const buyerFeedbackEnum = pgEnum("buyer_feedback", [
  "positive",
  "neutral",
  "negative",
]);

export const buyerFeedbackPricingEnum = pgEnum("buyer_feedback_pricing", [
  "fits",
  "too_high",
  "too_low",
]);

export const shelfAvailabilityEnum = pgEnum("shelf_availability", [
  "has_opening",
  "full",
  "unknown",
]);

export const sampleStatusEnum = pgEnum("sample_status", [
  "delivered",
  "awaiting_feedback",
  "feedback_received",
  "converted_to_order",
  "declined",
  "expired",
]);

export const orderStageEnum = pgEnum("order_stage", [
  "lead",
  "quote_sent",
  "confirmed",
  "processing",
  "ready_for_delivery",
  "delivered",
  "paid",
  "lost",
  "cancelled",
]);

export const orderSourceEnum = pgEnum("order_source", [
  "in_person",
  "phone",
  "text",
  "email",
  "leaflink",
  "growflow",
  "nabis",
  "distru",
  "other",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "partial",
  "paid",
  "overdue",
]);

export const lossReasonEnum = pgEnum("loss_reason", [
  "price",
  "competitor",
  "out_of_stock",
  "no_response",
  "quality",
  "shelf_full",
  "other",
]);

export const taskTypeEnum = pgEnum("task_type", [
  "follow_up_visit",
  "reorder_check",
  "send_menu",
  "budtender_training",
  "sample_follow_up",
  "vendor_day_prep",
  "manager_assigned",
  "custom",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "in_progress",
  "completed",
  "cancelled",
]);

export const routeStatusEnum = pgEnum("route_status", [
  "planned",
  "in_progress",
  "completed",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "vendor_day",
  "popup",
  "420_event",
  "budtender_training",
  "demo",
  "other",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "proposed",
  "confirmed",
  "completed",
  "cancelled",
]);

export const orderTrendEnum = pgEnum("order_trend", [
  "growing",
  "stable",
  "declining",
  "new",
]);

// ─── Tables ─────────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  logoUrl: text("logo_url"),
  primaryState: varchar("primary_state", { length: 2 }).default("WA"),
  orgSettings: jsonb("org_settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    email: varchar("email", { length: 255 }).unique().notNull(),
    passwordHash: text("password_hash").notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    role: userRoleEnum("role").notNull(),
    avatarUrl: text("avatar_url"),
    status: userStatusEnum("status").default("active"),
    preferences: jsonb("preferences"),
    lastActiveAt: timestamp("last_active_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_org_id_idx").on(table.orgId),
  ],
);

export const accountChains = pgTable(
  "account_chains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    name: varchar("name", { length: 255 }).notNull(),
    storeCount: integer("store_count").default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("account_chains_org_id_idx").on(table.orgId),
  ],
);

export const territories = pgTable(
  "territories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    zipCodes: text("zip_codes").array(),
    assignedRepIds: uuid("assigned_rep_ids").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("territories_org_id_idx").on(table.orgId),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    name: varchar("name", { length: 255 }).notNull(),
    dbaName: varchar("dba_name", { length: 255 }),
    addressLine1: varchar("address_line1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull().default("WA"),
    zip: varchar("zip", { length: 10 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    website: varchar("website", { length: 500 }),
    licenseNumber: varchar("license_number", { length: 100 }),
    licenseType: licenseTypeEnum("license_type").default("retailer"),
    licenseExpiration: date("license_expiration"),
    status: accountStatusEnum("status").default("prospect"),
    revenueTier: revenueTierEnum("revenue_tier").default("unranked"),
    chainId: uuid("chain_id").references(() => accountChains.id),
    assignedRepId: uuid("assigned_rep_id").references(() => users.id),
    territoryId: uuid("territory_id").references(() => territories.id),
    paymentTerms: paymentTermsEnum("payment_terms").default("cod"),
    notes: text("notes"),
    tags: text("tags").array(),
    googlePlaceId: varchar("google_place_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => [
    index("accounts_org_status_idx").on(table.orgId, table.status),
    index("accounts_org_rep_idx").on(table.orgId, table.assignedRepId),
    index("accounts_org_tier_idx").on(table.orgId, table.revenueTier),
    index("accounts_chain_id_idx").on(table.chainId),
    index("accounts_territory_id_idx").on(table.territoryId),
  ],
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    role: contactRoleEnum("role").default("buyer"),
    roleLabel: varchar("role_label", { length: 100 }),
    isPrimaryDecisionMaker: boolean("is_primary_decision_maker").default(false),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    preferredContactMethod: preferredContactMethodEnum(
      "preferred_contact_method",
    ).default("phone"),
    bestVisitDays: text("best_visit_days").array(),
    bestVisitTimes: varchar("best_visit_times", { length: 100 }),
    notes: text("notes"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("contacts_account_id_idx").on(table.accountId),
    index("contacts_org_id_idx").on(table.orgId),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    name: varchar("name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 50 }).notNull(),
    category: productCategoryEnum("category"),
    subcategory: varchar("subcategory", { length: 100 }),
    strainName: varchar("strain_name", { length: 100 }),
    strainType: strainTypeEnum("strain_type"),
    thcPercentMin: decimal("thc_percent_min", { precision: 5, scale: 2 }),
    thcPercentMax: decimal("thc_percent_max", { precision: 5, scale: 2 }),
    cbdPercentMin: decimal("cbd_percent_min", { precision: 5, scale: 2 }),
    cbdPercentMax: decimal("cbd_percent_max", { precision: 5, scale: 2 }),
    unitSize: varchar("unit_size", { length: 50 }).notNull(),
    wholesalePrice: decimal("wholesale_price", {
      precision: 10,
      scale: 2,
    }).notNull(),
    msrp: decimal("msrp", { precision: 10, scale: 2 }),
    availableInventory: integer("available_inventory"),
    status: productStatusEnum("status").default("active"),
    growType: varchar("grow_type", { length: 100 }),
    turnaroundTime: varchar("turnaround_time", { length: 100 }),
    minimumOrder: varchar("minimum_order", { length: 100 }),
    coaUrl: text("coa_url"),
    imageUrl: text("image_url"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("products_org_id_idx").on(table.orgId),
  ],
);

export const visits = pgTable(
  "visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    repId: uuid("rep_id")
      .notNull()
      .references(() => users.id),
    visitType: visitTypeEnum("visit_type"),
    outcome: visitOutcomeEnum("outcome"),
    contactsMet: uuid("contacts_met").array(),
    productsDiscussed: uuid("products_discussed").array(),
    notes: text("notes"),
    aiRawTranscript: text("ai_raw_transcript"),
    aiExtractedData: jsonb("ai_extracted_data"),
    photos: text("photos").array(),
    checkInLat: decimal("check_in_lat", { precision: 10, scale: 7 }),
    checkInLng: decimal("check_in_lng", { precision: 10, scale: 7 }),
    checkInTime: timestamp("check_in_time").defaultNow().notNull(),
    checkOutTime: timestamp("check_out_time"),
    nextFollowUpDate: date("next_follow_up_date"),
    nextFollowUpNotes: text("next_follow_up_notes"),
    buyerFeedbackLook: buyerFeedbackEnum("buyer_feedback_look"),
    buyerFeedbackSmell: buyerFeedbackEnum("buyer_feedback_smell"),
    buyerFeedbackPackaging: buyerFeedbackEnum("buyer_feedback_packaging"),
    buyerFeedbackPricing: buyerFeedbackPricingEnum("buyer_feedback_pricing"),
    shelfAvailability: shelfAvailabilityEnum("shelf_availability"),
    competitorBrandsNoted: text("competitor_brands_noted").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("visits_org_rep_time_idx").on(
      table.orgId,
      table.repId,
      table.checkInTime,
    ),
    index("visits_org_account_idx").on(table.orgId, table.accountId),
  ],
);

export const samples = pgTable(
  "samples",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    visitId: uuid("visit_id").references(() => visits.id),
    repId: uuid("rep_id")
      .notNull()
      .references(() => users.id),
    droppedOffDate: date("dropped_off_date").notNull(),
    productsSampled: jsonb("products_sampled").notNull(),
    recipientContactId: uuid("recipient_contact_id").references(
      () => contacts.id,
    ),
    status: sampleStatusEnum("status").default("delivered"),
    feedbackDueDate: date("feedback_due_date"),
    feedbackNotes: text("feedback_notes"),
    followUpCount: integer("follow_up_count").default(0),
    lastFollowUpDate: date("last_follow_up_date"),
    convertedOrderId: uuid("converted_order_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("samples_org_status_feedback_idx").on(
      table.orgId,
      table.status,
      table.feedbackDueDate,
    ),
    index("samples_account_id_idx").on(table.accountId),
    index("samples_visit_id_idx").on(table.visitId),
    index("samples_rep_id_idx").on(table.repId),
    index("samples_recipient_contact_idx").on(table.recipientContactId),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    repId: uuid("rep_id")
      .notNull()
      .references(() => users.id),
    stage: orderStageEnum("stage").default("lead"),
    source: orderSourceEnum("source").default("in_person"),
    expectedCloseDate: date("expected_close_date"),
    actualCloseDate: date("actual_close_date"),
    deliveryDate: date("delivery_date"),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0"),
    discountAmount: decimal("discount_amount", {
      precision: 10,
      scale: 2,
    }).default("0"),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
    total: decimal("total", { precision: 10, scale: 2 }).default("0"),
    paymentTerms: paymentTermsEnum("payment_terms").default("cod"),
    paymentStatus: paymentStatusEnum("payment_status").default("unpaid"),
    linkedVisitId: uuid("linked_visit_id").references(() => visits.id),
    linkedSampleId: uuid("linked_sample_id").references(() => samples.id),
    lossReason: lossReasonEnum("loss_reason"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("orders_org_stage_idx").on(table.orgId, table.stage),
    index("orders_org_account_idx").on(table.orgId, table.accountId),
    index("orders_rep_id_idx").on(table.repId),
    index("orders_linked_visit_idx").on(table.linkedVisitId),
    index("orders_linked_sample_idx").on(table.linkedSampleId),
  ],
);

export const orderLineItems = pgTable(
  "order_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    discountPercent: decimal("discount_percent", {
      precision: 5,
      scale: 2,
    }).default("0"),
    lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("order_line_items_order_id_idx").on(table.orderId),
    index("order_line_items_product_id_idx").on(table.productId),
  ],
);

export const orderStageHistory = pgTable(
  "order_stage_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    fromStage: varchar("from_stage", { length: 50 }),
    toStage: varchar("to_stage", { length: 50 }).notNull(),
    changedBy: uuid("changed_by")
      .notNull()
      .references(() => users.id),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("order_stage_history_order_id_idx").on(table.orderId),
    index("order_stage_history_changed_by_idx").on(table.changedBy),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    accountId: uuid("account_id").references(() => accounts.id),
    assignedTo: uuid("assigned_to")
      .notNull()
      .references(() => users.id),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    taskType: taskTypeEnum("task_type"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    dueDate: date("due_date").notNull(),
    priority: taskPriorityEnum("priority").default("medium"),
    status: taskStatusEnum("status").default("open"),
    completedAt: timestamp("completed_at"),
    linkedVisitId: uuid("linked_visit_id").references(() => visits.id),
    linkedOrderId: uuid("linked_order_id").references(() => orders.id),
    linkedSampleId: uuid("linked_sample_id").references(() => samples.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tasks_org_assigned_status_due_idx").on(
      table.orgId,
      table.assignedTo,
      table.status,
      table.dueDate,
    ),
    index("tasks_account_id_idx").on(table.accountId),
    index("tasks_created_by_idx").on(table.createdBy),
    index("tasks_linked_visit_idx").on(table.linkedVisitId),
    index("tasks_linked_order_idx").on(table.linkedOrderId),
    index("tasks_linked_sample_idx").on(table.linkedSampleId),
  ],
);

export const dailyRoutes = pgTable(
  "daily_routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    repId: uuid("rep_id")
      .notNull()
      .references(() => users.id),
    routeDate: date("route_date").notNull(),
    status: routeStatusEnum("status").default("planned"),
    stops: jsonb("stops").notNull(),
    totalDistanceMiles: decimal("total_distance_miles", {
      precision: 8,
      scale: 2,
    }),
    totalDriveTimeMinutes: integer("total_drive_time_minutes"),
    aiSuggested: boolean("ai_suggested").default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("daily_routes_org_rep_date_idx").on(
      table.orgId,
      table.repId,
      table.routeDate,
    ),
  ],
);

export const vendorEvents = pgTable(
  "vendor_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    repId: uuid("rep_id").references(() => users.id),
    eventType: eventTypeEnum("event_type"),
    eventDate: date("event_date").notNull(),
    startTime: varchar("start_time", { length: 10 }),
    endTime: varchar("end_time", { length: 10 }),
    status: eventStatusEnum("status").default("proposed"),
    customerInteractions: integer("customer_interactions"),
    unitsSold: integer("units_sold"),
    budtendersTrained: integer("budtenders_trained"),
    notes: text("notes"),
    photos: text("photos").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("vendor_events_org_id_idx").on(table.orgId),
    index("vendor_events_account_id_idx").on(table.accountId),
    index("vendor_events_rep_id_idx").on(table.repId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    link: varchar("link", { length: 500 }),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_read_created_idx").on(
      table.userId,
      table.isRead,
      table.createdAt,
    ),
    index("notifications_org_id_idx").on(table.orgId),
  ],
);

export const accountVelocityMetrics = pgTable(
  "account_velocity_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    avgOrderFrequencyDays: decimal("avg_order_frequency_days", {
      precision: 8,
      scale: 2,
    }),
    avgOrderValue: decimal("avg_order_value", { precision: 10, scale: 2 }),
    lastOrderDate: date("last_order_date"),
    nextPredictedOrderDate: date("next_predicted_order_date"),
    totalOrders: integer("total_orders").default(0),
    totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default(
      "0",
    ),
    topProducts: jsonb("top_products"),
    orderTrend: orderTrendEnum("order_trend"),
    lastCalculatedAt: timestamp("last_calculated_at"),
  },
  (table) => [
    uniqueIndex("account_velocity_org_account_idx").on(
      table.orgId,
      table.accountId,
    ),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  accounts: many(accounts),
  accountChains: many(accountChains),
  territories: many(territories),
  products: many(products),
  visits: many(visits),
  samples: many(samples),
  orders: many(orders),
  tasks: many(tasks),
  dailyRoutes: many(dailyRoutes),
  vendorEvents: many(vendorEvents),
  notifications: many(notifications),
  accountVelocityMetrics: many(accountVelocityMetrics),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
  assignedAccounts: many(accounts, { relationName: "assignedRep" }),
  createdAccounts: many(accounts, { relationName: "accountCreator" }),
  visits: many(visits),
  samples: many(samples),
  orders: many(orders),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  createdTasks: many(tasks, { relationName: "taskCreator" }),
  dailyRoutes: many(dailyRoutes),
  vendorEvents: many(vendorEvents),
  notifications: many(notifications),
  stageChanges: many(orderStageHistory),
}));

export const accountChainsRelations = relations(
  accountChains,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [accountChains.orgId],
      references: [organizations.id],
    }),
    accounts: many(accounts),
  }),
);

export const territoriesRelations = relations(
  territories,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [territories.orgId],
      references: [organizations.id],
    }),
    accounts: many(accounts),
  }),
);

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [accounts.orgId],
    references: [organizations.id],
  }),
  chain: one(accountChains, {
    fields: [accounts.chainId],
    references: [accountChains.id],
  }),
  assignedRep: one(users, {
    fields: [accounts.assignedRepId],
    references: [users.id],
    relationName: "assignedRep",
  }),
  territory: one(territories, {
    fields: [accounts.territoryId],
    references: [territories.id],
  }),
  createdByUser: one(users, {
    fields: [accounts.createdBy],
    references: [users.id],
    relationName: "accountCreator",
  }),
  contacts: many(contacts),
  visits: many(visits),
  samples: many(samples),
  orders: many(orders),
  tasks: many(tasks),
  vendorEvents: many(vendorEvents),
  velocityMetrics: many(accountVelocityMetrics),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  account: one(accounts, {
    fields: [contacts.accountId],
    references: [accounts.id],
  }),
  organization: one(organizations, {
    fields: [contacts.orgId],
    references: [organizations.id],
  }),
  samplesReceived: many(samples),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.orgId],
    references: [organizations.id],
  }),
  orderLineItems: many(orderLineItems),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [visits.orgId],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [visits.accountId],
    references: [accounts.id],
  }),
  rep: one(users, {
    fields: [visits.repId],
    references: [users.id],
  }),
  samples: many(samples),
  linkedOrders: many(orders, { relationName: "orderVisit" }),
  linkedTasks: many(tasks, { relationName: "taskVisit" }),
}));

export const samplesRelations = relations(samples, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [samples.orgId],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [samples.accountId],
    references: [accounts.id],
  }),
  visit: one(visits, {
    fields: [samples.visitId],
    references: [visits.id],
  }),
  rep: one(users, {
    fields: [samples.repId],
    references: [users.id],
  }),
  recipientContact: one(contacts, {
    fields: [samples.recipientContactId],
    references: [contacts.id],
  }),
  linkedOrders: many(orders, { relationName: "orderSample" }),
  linkedTasks: many(tasks, { relationName: "taskSample" }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [orders.orgId],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [orders.accountId],
    references: [accounts.id],
  }),
  rep: one(users, {
    fields: [orders.repId],
    references: [users.id],
  }),
  linkedVisit: one(visits, {
    fields: [orders.linkedVisitId],
    references: [visits.id],
    relationName: "orderVisit",
  }),
  linkedSample: one(samples, {
    fields: [orders.linkedSampleId],
    references: [samples.id],
    relationName: "orderSample",
  }),
  lineItems: many(orderLineItems),
  stageHistory: many(orderStageHistory),
  linkedTasks: many(tasks, { relationName: "taskOrder" }),
}));

export const orderLineItemsRelations = relations(
  orderLineItems,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderLineItems.orderId],
      references: [orders.id],
    }),
    product: one(products, {
      fields: [orderLineItems.productId],
      references: [products.id],
    }),
  }),
);

export const orderStageHistoryRelations = relations(
  orderStageHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStageHistory.orderId],
      references: [orders.id],
    }),
    changedByUser: one(users, {
      fields: [orderStageHistory.changedBy],
      references: [users.id],
    }),
  }),
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  organization: one(organizations, {
    fields: [tasks.orgId],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [tasks.accountId],
    references: [accounts.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "taskAssignee",
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "taskCreator",
  }),
  linkedVisit: one(visits, {
    fields: [tasks.linkedVisitId],
    references: [visits.id],
    relationName: "taskVisit",
  }),
  linkedOrder: one(orders, {
    fields: [tasks.linkedOrderId],
    references: [orders.id],
    relationName: "taskOrder",
  }),
  linkedSample: one(samples, {
    fields: [tasks.linkedSampleId],
    references: [samples.id],
    relationName: "taskSample",
  }),
}));

export const dailyRoutesRelations = relations(dailyRoutes, ({ one }) => ({
  organization: one(organizations, {
    fields: [dailyRoutes.orgId],
    references: [organizations.id],
  }),
  rep: one(users, {
    fields: [dailyRoutes.repId],
    references: [users.id],
  }),
}));

export const vendorEventsRelations = relations(vendorEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [vendorEvents.orgId],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [vendorEvents.accountId],
    references: [accounts.id],
  }),
  rep: one(users, {
    fields: [vendorEvents.repId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [notifications.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const accountVelocityMetricsRelations = relations(
  accountVelocityMetrics,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [accountVelocityMetrics.orgId],
      references: [organizations.id],
    }),
    account: one(accounts, {
      fields: [accountVelocityMetrics.accountId],
      references: [accounts.id],
    }),
  }),
);
