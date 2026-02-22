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
