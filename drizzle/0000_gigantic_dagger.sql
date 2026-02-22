CREATE TYPE "public"."account_status" AS ENUM('prospect', 'sample_sent', 'active', 'at_risk', 'dormant', 'churned');--> statement-breakpoint
CREATE TYPE "public"."buyer_feedback" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TYPE "public"."buyer_feedback_pricing" AS ENUM('fits', 'too_high', 'too_low');--> statement-breakpoint
CREATE TYPE "public"."contact_role" AS ENUM('buyer', 'store_manager', 'assistant_manager', 'budtender', 'owner', 'other');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('proposed', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('vendor_day', 'popup', '420_event', 'budtender_training', 'demo', 'other');--> statement-breakpoint
CREATE TYPE "public"."license_type" AS ENUM('retailer', 'microbusiness', 'delivery', 'consumption_lounge', 'other');--> statement-breakpoint
CREATE TYPE "public"."loss_reason" AS ENUM('price', 'competitor', 'out_of_stock', 'no_response', 'quality', 'shelf_full', 'other');--> statement-breakpoint
CREATE TYPE "public"."order_source" AS ENUM('in_person', 'phone', 'text', 'email', 'leaflink', 'growflow', 'nabis', 'distru', 'other');--> statement-breakpoint
CREATE TYPE "public"."order_stage" AS ENUM('lead', 'quote_sent', 'confirmed', 'processing', 'ready_for_delivery', 'delivered', 'paid', 'lost', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_trend" AS ENUM('growing', 'stable', 'declining', 'new');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partial', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."payment_terms" AS ENUM('cod', 'net_15', 'net_30', 'net_45', 'custom');--> statement-breakpoint
CREATE TYPE "public"."preferred_contact_method" AS ENUM('phone', 'email', 'text', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('flower', 'pre_roll', 'edible', 'vape', 'concentrate', 'topical', 'tincture', 'accessory', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'limited', 'out_of_stock', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."revenue_tier" AS ENUM('A', 'B', 'C', 'D', 'unranked');--> statement-breakpoint
CREATE TYPE "public"."route_status" AS ENUM('planned', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."sample_status" AS ENUM('delivered', 'awaiting_feedback', 'feedback_received', 'converted_to_order', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."shelf_availability" AS ENUM('has_opening', 'full', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."strain_type" AS ENUM('indica', 'sativa', 'hybrid', 'cbd', 'blend');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('follow_up_visit', 'reorder_check', 'send_menu', 'budtender_training', 'sample_follow_up', 'vendor_day_prep', 'manager_assigned', 'custom');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'sales_manager', 'sales_rep');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('invited', 'active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."visit_outcome" AS ENUM('order_placed', 'reorder_confirmed', 'sample_left', 'follow_up_needed', 'no_decision', 'buyer_unavailable', 'declined', 'other');--> statement-breakpoint
CREATE TYPE "public"."visit_type" AS ENUM('scheduled_meeting', 'drop_in', 'delivery', 'budtender_training', 'sample_drop', 'vendor_day', 'popup_event', 'other');--> statement-breakpoint
CREATE TABLE "account_chains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"store_count" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_velocity_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"avg_order_frequency_days" numeric(8, 2),
	"avg_order_value" numeric(10, 2),
	"last_order_date" date,
	"next_predicted_order_date" date,
	"total_orders" integer DEFAULT 0,
	"total_revenue" numeric(12, 2) DEFAULT '0',
	"top_products" jsonb,
	"order_trend" "order_trend",
	"last_calculated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"dba_name" varchar(255),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(2) DEFAULT 'WA' NOT NULL,
	"zip" varchar(10) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"phone" varchar(20),
	"email" varchar(255),
	"website" varchar(500),
	"license_number" varchar(100),
	"license_type" "license_type" DEFAULT 'retailer',
	"license_expiration" date,
	"status" "account_status" DEFAULT 'prospect',
	"revenue_tier" "revenue_tier" DEFAULT 'unranked',
	"chain_id" uuid,
	"assigned_rep_id" uuid,
	"territory_id" uuid,
	"payment_terms" "payment_terms" DEFAULT 'cod',
	"notes" text,
	"tags" text[],
	"google_place_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" "contact_role" DEFAULT 'buyer',
	"role_label" varchar(100),
	"is_primary_decision_maker" boolean DEFAULT false,
	"phone" varchar(20),
	"email" varchar(255),
	"preferred_contact_method" "preferred_contact_method" DEFAULT 'phone',
	"best_visit_days" text[],
	"best_visit_times" varchar(100),
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"rep_id" uuid NOT NULL,
	"route_date" date NOT NULL,
	"status" "route_status" DEFAULT 'planned',
	"stops" jsonb NOT NULL,
	"total_distance_miles" numeric(8, 2),
	"total_drive_time_minutes" integer,
	"ai_suggested" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"link" varchar(500),
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"line_total" numeric(10, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "order_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_stage" varchar(50),
	"to_stage" varchar(50) NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"rep_id" uuid NOT NULL,
	"stage" "order_stage" DEFAULT 'lead',
	"source" "order_source" DEFAULT 'in_person',
	"expected_close_date" date,
	"actual_close_date" date,
	"delivery_date" date,
	"subtotal" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) DEFAULT '0',
	"payment_terms" "payment_terms" DEFAULT 'cod',
	"payment_status" "payment_status" DEFAULT 'unpaid',
	"linked_visit_id" uuid,
	"linked_sample_id" uuid,
	"loss_reason" "loss_reason",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"logo_url" text,
	"primary_state" varchar(2) DEFAULT 'WA',
	"org_settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(50) NOT NULL,
	"category" "product_category",
	"subcategory" varchar(100),
	"strain_name" varchar(100),
	"strain_type" "strain_type",
	"thc_percent_min" numeric(5, 2),
	"thc_percent_max" numeric(5, 2),
	"cbd_percent_min" numeric(5, 2),
	"cbd_percent_max" numeric(5, 2),
	"unit_size" varchar(50) NOT NULL,
	"wholesale_price" numeric(10, 2) NOT NULL,
	"msrp" numeric(10, 2),
	"available_inventory" integer,
	"status" "product_status" DEFAULT 'active',
	"grow_type" varchar(100),
	"turnaround_time" varchar(100),
	"minimum_order" varchar(100),
	"coa_url" text,
	"image_url" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"visit_id" uuid,
	"rep_id" uuid NOT NULL,
	"dropped_off_date" date NOT NULL,
	"products_sampled" jsonb NOT NULL,
	"recipient_contact_id" uuid,
	"status" "sample_status" DEFAULT 'delivered',
	"feedback_due_date" date,
	"feedback_notes" text,
	"follow_up_count" integer DEFAULT 0,
	"last_follow_up_date" date,
	"converted_order_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"account_id" uuid,
	"assigned_to" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"task_type" "task_type",
	"title" varchar(255) NOT NULL,
	"description" text,
	"due_date" date NOT NULL,
	"priority" "task_priority" DEFAULT 'medium',
	"status" "task_status" DEFAULT 'open',
	"completed_at" timestamp,
	"linked_visit_id" uuid,
	"linked_order_id" uuid,
	"linked_sample_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "territories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"zip_codes" text[],
	"assigned_rep_ids" uuid[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"role" "user_role" NOT NULL,
	"avatar_url" text,
	"status" "user_status" DEFAULT 'active',
	"preferences" jsonb,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"rep_id" uuid,
	"event_type" "event_type",
	"event_date" date NOT NULL,
	"start_time" varchar(10),
	"end_time" varchar(10),
	"status" "event_status" DEFAULT 'proposed',
	"customer_interactions" integer,
	"units_sold" integer,
	"budtenders_trained" integer,
	"notes" text,
	"photos" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"rep_id" uuid NOT NULL,
	"visit_type" "visit_type",
	"outcome" "visit_outcome",
	"contacts_met" uuid[],
	"products_discussed" uuid[],
	"notes" text,
	"ai_raw_transcript" text,
	"ai_extracted_data" jsonb,
	"photos" text[],
	"check_in_lat" numeric(10, 7),
	"check_in_lng" numeric(10, 7),
	"check_in_time" timestamp DEFAULT now() NOT NULL,
	"check_out_time" timestamp,
	"next_follow_up_date" date,
	"next_follow_up_notes" text,
	"buyer_feedback_look" "buyer_feedback",
	"buyer_feedback_smell" "buyer_feedback",
	"buyer_feedback_packaging" "buyer_feedback",
	"buyer_feedback_pricing" "buyer_feedback_pricing",
	"shelf_availability" "shelf_availability",
	"competitor_brands_noted" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_chains" ADD CONSTRAINT "account_chains_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_velocity_metrics" ADD CONSTRAINT "account_velocity_metrics_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_velocity_metrics" ADD CONSTRAINT "account_velocity_metrics_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_chain_id_account_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."account_chains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_assigned_rep_id_users_id_fk" FOREIGN KEY ("assigned_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_territory_id_territories_id_fk" FOREIGN KEY ("territory_id") REFERENCES "public"."territories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_routes" ADD CONSTRAINT "daily_routes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_routes" ADD CONSTRAINT "daily_routes_rep_id_users_id_fk" FOREIGN KEY ("rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_stage_history" ADD CONSTRAINT "order_stage_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_stage_history" ADD CONSTRAINT "order_stage_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_rep_id_users_id_fk" FOREIGN KEY ("rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_linked_visit_id_visits_id_fk" FOREIGN KEY ("linked_visit_id") REFERENCES "public"."visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_linked_sample_id_samples_id_fk" FOREIGN KEY ("linked_sample_id") REFERENCES "public"."samples"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "samples" ADD CONSTRAINT "samples_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "samples" ADD CONSTRAINT "samples_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "samples" ADD CONSTRAINT "samples_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "samples" ADD CONSTRAINT "samples_rep_id_users_id_fk" FOREIGN KEY ("rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "samples" ADD CONSTRAINT "samples_recipient_contact_id_contacts_id_fk" FOREIGN KEY ("recipient_contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_linked_visit_id_visits_id_fk" FOREIGN KEY ("linked_visit_id") REFERENCES "public"."visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_linked_order_id_orders_id_fk" FOREIGN KEY ("linked_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_linked_sample_id_samples_id_fk" FOREIGN KEY ("linked_sample_id") REFERENCES "public"."samples"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "territories" ADD CONSTRAINT "territories_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_events" ADD CONSTRAINT "vendor_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_events" ADD CONSTRAINT "vendor_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_events" ADD CONSTRAINT "vendor_events_rep_id_users_id_fk" FOREIGN KEY ("rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_rep_id_users_id_fk" FOREIGN KEY ("rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_chains_org_id_idx" ON "account_chains" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_velocity_org_account_idx" ON "account_velocity_metrics" USING btree ("org_id","account_id");--> statement-breakpoint
CREATE INDEX "accounts_org_status_idx" ON "accounts" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "accounts_org_rep_idx" ON "accounts" USING btree ("org_id","assigned_rep_id");--> statement-breakpoint
CREATE INDEX "accounts_org_tier_idx" ON "accounts" USING btree ("org_id","revenue_tier");--> statement-breakpoint
CREATE INDEX "accounts_chain_id_idx" ON "accounts" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX "accounts_territory_id_idx" ON "accounts" USING btree ("territory_id");--> statement-breakpoint
CREATE INDEX "contacts_account_id_idx" ON "contacts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "contacts_org_id_idx" ON "contacts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "daily_routes_org_rep_date_idx" ON "daily_routes" USING btree ("org_id","rep_id","route_date");--> statement-breakpoint
CREATE INDEX "notifications_user_read_created_idx" ON "notifications" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "notifications_org_id_idx" ON "notifications" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "order_line_items_order_id_idx" ON "order_line_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_line_items_product_id_idx" ON "order_line_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_stage_history_order_id_idx" ON "order_stage_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_stage_history_changed_by_idx" ON "order_stage_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "orders_org_stage_idx" ON "orders" USING btree ("org_id","stage");--> statement-breakpoint
CREATE INDEX "orders_org_account_idx" ON "orders" USING btree ("org_id","account_id");--> statement-breakpoint
CREATE INDEX "orders_rep_id_idx" ON "orders" USING btree ("rep_id");--> statement-breakpoint
CREATE INDEX "orders_linked_visit_idx" ON "orders" USING btree ("linked_visit_id");--> statement-breakpoint
CREATE INDEX "orders_linked_sample_idx" ON "orders" USING btree ("linked_sample_id");--> statement-breakpoint
CREATE INDEX "products_org_id_idx" ON "products" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "samples_org_status_feedback_idx" ON "samples" USING btree ("org_id","status","feedback_due_date");--> statement-breakpoint
CREATE INDEX "samples_account_id_idx" ON "samples" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "samples_visit_id_idx" ON "samples" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "samples_rep_id_idx" ON "samples" USING btree ("rep_id");--> statement-breakpoint
CREATE INDEX "samples_recipient_contact_idx" ON "samples" USING btree ("recipient_contact_id");--> statement-breakpoint
CREATE INDEX "tasks_org_assigned_status_due_idx" ON "tasks" USING btree ("org_id","assigned_to","status","due_date");--> statement-breakpoint
CREATE INDEX "tasks_account_id_idx" ON "tasks" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "tasks_created_by_idx" ON "tasks" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "tasks_linked_visit_idx" ON "tasks" USING btree ("linked_visit_id");--> statement-breakpoint
CREATE INDEX "tasks_linked_order_idx" ON "tasks" USING btree ("linked_order_id");--> statement-breakpoint
CREATE INDEX "tasks_linked_sample_idx" ON "tasks" USING btree ("linked_sample_id");--> statement-breakpoint
CREATE INDEX "territories_org_id_idx" ON "territories" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "users_org_id_idx" ON "users" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vendor_events_org_id_idx" ON "vendor_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vendor_events_account_id_idx" ON "vendor_events" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "vendor_events_rep_id_idx" ON "vendor_events" USING btree ("rep_id");--> statement-breakpoint
CREATE INDEX "visits_org_rep_time_idx" ON "visits" USING btree ("org_id","rep_id","check_in_time");--> statement-breakpoint
CREATE INDEX "visits_org_account_idx" ON "visits" USING btree ("org_id","account_id");