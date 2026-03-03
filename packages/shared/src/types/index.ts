import type { z } from "zod";
import type {
  userSchema,
  userProfileSchema,
  clientSchema,
  invoiceSchema,
  invoiceLineSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  createClientSchema,
  createUserProfileSchema,
} from "../schemas/index.js";

export type User = z.infer<typeof userSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type Client = z.infer<typeof clientSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceLine = z.infer<typeof invoiceLineSchema>;
export type CreateInvoice = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;
export type CreateUserProfile = z.infer<typeof createUserProfileSchema>;
