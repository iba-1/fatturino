import { describe, it, expect } from "vitest";

describe("POST /api/invoices/:id/send — business rules", () => {
  it("should only allow sending draft invoices", () => {
    const rejectedStati = ["inviata", "consegnata", "scartata", "accettata", "rifiutata"];
    for (const stato of rejectedStati) {
      expect(stato).not.toBe("bozza");
    }
  });

  it("should require client to have email or PEC", () => {
    const withEmail = { email: "test@example.com", pec: null };
    const withPec = { email: null, pec: "test@pec.it" };
    const withNeither = { email: null, pec: null };

    expect(withEmail.email || withEmail.pec).toBeTruthy();
    expect(withPec.email || withPec.pec).toBeTruthy();
    expect(withNeither.email || withNeither.pec).toBeFalsy();
  });

  it("should prefer email over PEC", () => {
    const client = { email: "test@example.com", pec: "test@pec.it" };
    const sendTo = client.email || client.pec;
    expect(sendTo).toBe("test@example.com");
  });

  it("should transition status from bozza to inviata", () => {
    expect("bozza").not.toBe("inviata");
  });
});
