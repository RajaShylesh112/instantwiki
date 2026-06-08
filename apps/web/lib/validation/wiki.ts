import { z } from "zod"

// Slug validation rules: lowercase, URL-safe, hyphen-separated only
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createWikiSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters.")
    .max(100, "Title cannot exceed 100 characters.")
    .trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(100, "Slug cannot exceed 100 characters.")
    .toLowerCase()
    .regex(slugRegex, "Slug must be lowercase, alphanumeric, and hyphen-separated only (e.g. ml-atlas).")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
  visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"], {
    message: "Visibility must be PRIVATE, UNLISTED, or PUBLIC.",
  }),
})

export type CreateWikiInput = z.infer<typeof createWikiSchema>

// Zod Schema for AI Name suggestion response validation
export const aiWikiSuggestionSchema = z.object({
  title: z.string().min(2).max(100),
  slug: z.string().regex(slugRegex),
  description: z.string().max(500),
})

export const aiNameSuggestionsSchema = z.object({
  names: z.array(aiWikiSuggestionSchema).min(1),
})

export type AiWikiSuggestion = z.infer<typeof aiWikiSuggestionSchema>
export type AiNameSuggestions = z.infer<typeof aiNameSuggestionsSchema>
