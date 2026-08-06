ALTER TABLE "profiles" ADD COLUMN "stripe_connect_account_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "stripe_onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "stripe_charges_enabled" boolean DEFAULT false NOT NULL;