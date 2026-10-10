import { z } from "zod";

export const roleSchema = z.enum(["FARMER", "UNDERWRITER", "VERIFIER", "BUYER", "ADMIN"]);
export const policyQuoteSchema = z.object({
  farmId: z.string().uuid(), crop: z.string().min(2).max(80), region: z.string().min(2).max(120),
  peril: z.enum(["LOW_RAINFALL", "HIGH_RAINFALL", "HIGH_TEMPERATURE"]), threshold: z.number().positive(),
  coverageMinor: z.bigint().positive(), startsAt: z.coerce.date(), endsAt: z.coerce.date(),
}).refine(v => v.endsAt > v.startsAt, "Monitoring window must end after it starts");

export const evidenceSubmissionSchema = z.object({
  farmId: z.string().uuid(), category: z.enum(["COVER_CROP", "REDUCED_TILLAGE", "WATER_STEWARDSHIP", "AGROFORESTRY"]),
  description: z.string().min(20).max(2000), activityDate: z.coerce.date(), contentHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  metadataCid: z.string().min(20).max(200), publicGeohash: z.string().max(12).optional(),
});

export type Role = z.infer<typeof roleSchema>;
export type PolicyQuote = z.infer<typeof policyQuoteSchema>;
