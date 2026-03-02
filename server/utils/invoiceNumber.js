import Invoice from "../models/Invoice.js";

export const generateInvoiceNumber = async () => {
  const latest = await Invoice.findOne({ invoiceNumber: { $regex: /^INV-\d+$/ } })
    .sort({ createdAt: -1 })
    .select("invoiceNumber");

  if (!latest?.invoiceNumber) {
    return "INV-0001";
  }

  const lastNum = Number(latest.invoiceNumber.split("-")[1] || 0);
  const nextNum = String(lastNum + 1).padStart(4, "0");
  return `INV-${nextNum}`;
};
