import { describe, it, expect } from "vitest";
import { z } from "zod";

// Replicate the paymentSchema defined in taxes.ts so we can unit-test it
// without importing the route (which would pull in DB/Fastify dependencies).
const paymentSchema = z.object({
  anno: z.number().int().min(1900).max(2100),
  deadline: z.enum(["primo_acconto", "secondo_acconto", "saldo"]),
  amountPaid: z.number().nonnegative(),
  datePaid: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

describe("POST /api/taxes/payments — paymentSchema validation", () => {
  it("accepts valid payment data for each deadline variant", () => {
    const deadlines = ["primo_acconto", "secondo_acconto", "saldo"] as const;
    for (const deadline of deadlines) {
      const result = paymentSchema.safeParse({
        anno: 2025,
        deadline,
        amountPaid: 1250.5,
        datePaid: "2025-06-15",
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts amountPaid of zero (not yet fully paid)", () => {
    const result = paymentSchema.safeParse({
      anno: 2025,
      deadline: "primo_acconto",
      amountPaid: 0,
      datePaid: "2025-06-30",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid deadline string", () => {
    const result = paymentSchema.safeParse({
      anno: 2025,
      deadline: "acconto_errato",
      amountPaid: 500,
      datePaid: "2025-06-15",
    });
    expect(result.success).toBe(false);
    const issues = result.error!.issues;
    expect(issues.some((i) => i.path.includes("deadline"))).toBe(true);
  });

  it("rejects a negative amountPaid", () => {
    const result = paymentSchema.safeParse({
      anno: 2025,
      deadline: "saldo",
      amountPaid: -100,
      datePaid: "2025-06-30",
    });
    expect(result.success).toBe(false);
    const issues = result.error!.issues;
    expect(issues.some((i) => i.path.includes("amountPaid"))).toBe(true);
  });

  it("rejects an invalid date format (not YYYY-MM-DD)", () => {
    const invalidDates = ["15/06/2025", "2025/06/15", "June 15, 2025", "20250615", "2025-6-15"];
    for (const datePaid of invalidDates) {
      const result = paymentSchema.safeParse({
        anno: 2025,
        deadline: "primo_acconto",
        amountPaid: 500,
        datePaid,
      });
      expect(result.success).toBe(false);
      const issues = result.error!.issues;
      expect(issues.some((i) => i.path.includes("datePaid"))).toBe(true);
    }
  });

  it("rejects anno outside allowed range", () => {
    for (const anno of [1899, 2101]) {
      const result = paymentSchema.safeParse({
        anno,
        deadline: "saldo",
        amountPaid: 500,
        datePaid: "2025-06-30",
      });
      expect(result.success).toBe(false);
      const issues = result.error!.issues;
      expect(issues.some((i) => i.path.includes("anno"))).toBe(true);
    }
  });

  it("rejects a non-integer anno", () => {
    const result = paymentSchema.safeParse({
      anno: 2025.5,
      deadline: "saldo",
      amountPaid: 500,
      datePaid: "2025-06-30",
    });
    expect(result.success).toBe(false);
    const issues = result.error!.issues;
    expect(issues.some((i) => i.path.includes("anno"))).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = paymentSchema.safeParse({
      anno: 2025,
      deadline: "primo_acconto",
      // amountPaid and datePaid are missing
    });
    expect(result.success).toBe(false);
  });
});
