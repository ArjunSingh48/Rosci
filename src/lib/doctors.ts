export const DOCTORS = [
  { key: "nikolaus", name: "Dr. Nikolaus", email: "nikolaus@rosci.com", phone: "+41-77 000 11 22", isRealNumber: false },
  { key: "mustermann", name: "Dr. Mustermann", email: "mustermann@rosci.com", phone: "+41 11 222 33 44", isRealNumber: false },
  { key: "singh", name: "Dr. Arjun Singh", email: "arjun.singh@rosci.com", phone: "+41 77 289 70 56", isRealNumber: true },
  { key: "max", name: "Dr. Max", email: "max@rosci.com", phone: "+41 99 000 99 99", isRealNumber: false },
] as const;

export function getDoctorByKey(key: string | null | undefined) {
  return DOCTORS.find(d => d.key === key) ?? null;
}
