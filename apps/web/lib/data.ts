export type Role = "Farmer" | "Underwriter" | "Verifier" | "Business" | "Administrator";

export const impact = [
  { label: "Farmers protected", value: "1,248", note: "sample profiles" },
  { label: "Insured value", value: "$2.84M", note: "test coverage" },
  { label: "Payouts settled", value: "$184k", note: "simulated test token" },
  { label: "Units retired", value: "8,420", note: "demo environmental units" },
];

export const weather = [
  { day: "Mon", rainfall: 16, baseline: 22 },
  { day: "Tue", rainfall: 11, baseline: 21 },
  { day: "Wed", rainfall: 8, baseline: 20 },
  { day: "Thu", rainfall: 6, baseline: 19 },
  { day: "Fri", rainfall: 4, baseline: 18 },
  { day: "Sat", rainfall: 9, baseline: 20 },
  { day: "Sun", rainfall: 13, baseline: 21 },
];

export const evidence = [
  { id: "EV-2084", farm: "Riverbend Farm", practice: "Cover cropping", submitted: "Oct 08", status: "Quorum 2/3", score: 88 },
  { id: "EV-2081", farm: "Suncrest Co-op", practice: "Drip irrigation", submitted: "Oct 07", status: "Review", score: 93 },
  { id: "EV-2077", farm: "Nandi Fields", practice: "Reduced tillage", submitted: "Oct 06", status: "Disputed", score: 61 },
];

export const credits = [
  { id: "AGRO-2026-041", project: "Riverbend Cover Crop", units: 320, price: 7.4, methodology: "Demo Soil Practice v1", verified: 3 },
  { id: "AGRO-2026-038", project: "Nandi Water Stewardship", units: 180, price: 8.1, methodology: "Demo Water Saving v1", verified: 4 },
  { id: "AGRO-2026-029", project: "Suncrest No-Till", units: 640, price: 6.8, methodology: "Demo Soil Practice v1", verified: 3 },
];

export const policies = [
  { id: "POL-1048", crop: "Soybean", location: "Wardha, MH", coverage: "$8,400", threshold: "Rainfall < 42mm", state: "Monitoring" },
  { id: "POL-1031", crop: "Cotton", location: "Nagpur, MH", coverage: "$12,600", threshold: "Temp > 41°C", state: "Active" },
];
