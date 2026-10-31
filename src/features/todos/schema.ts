import { z } from "zod"

export const titleSchema = z.string().trim().min(1).max(500)
