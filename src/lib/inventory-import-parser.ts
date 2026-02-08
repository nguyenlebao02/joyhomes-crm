import { propertyCreateSchema } from "@/lib/validators/inventory-validation-schema";

export interface ImportRow {
  code: string;
  projectId: string;
  building?: string;
  floor?: number;
  unit?: string;
  propertyType: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  direction?: string;
  view?: string;
  price: number;
  pricePerSqm?: number;
  status?: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  valid: ImportRow[];
  errors: ImportError[];
  totalRows: number;
}

// Column header mapping (Vietnamese → field name)
const COLUMN_MAP: Record<string, keyof ImportRow> = {
  "mã căn": "code",
  "ma can": "code",
  code: "code",
  "dự án": "projectId",
  "du an": "projectId",
  "project": "projectId",
  "projectid": "projectId",
  "tòa": "building",
  "toa": "building",
  "building": "building",
  "tầng": "floor",
  "tang": "floor",
  "floor": "floor",
  "căn": "unit",
  "can": "unit",
  "unit": "unit",
  "loại": "propertyType",
  "loai": "propertyType",
  "type": "propertyType",
  "propertytype": "propertyType",
  "diện tích": "area",
  "dien tich": "area",
  "area": "area",
  "phòng ngủ": "bedrooms",
  "phong ngu": "bedrooms",
  "pn": "bedrooms",
  "bedrooms": "bedrooms",
  "phòng tắm": "bathrooms",
  "phong tam": "bathrooms",
  "pt": "bathrooms",
  "bathrooms": "bathrooms",
  "hướng": "direction",
  "huong": "direction",
  "direction": "direction",
  "view": "view",
  "giá": "price",
  "gia": "price",
  "price": "price",
  "giá/m²": "pricePerSqm",
  "pricepersqm": "pricePerSqm",
  "trạng thái": "status",
  "trang thai": "status",
  "status": "status",
};

// Property type mapping (Vietnamese → enum)
const TYPE_MAP: Record<string, string> = {
  "căn hộ": "APARTMENT",
  "apartment": "APARTMENT",
  "biệt thự": "VILLA",
  "villa": "VILLA",
  "nhà phố": "TOWNHOUSE",
  "townhouse": "TOWNHOUSE",
  "shophouse": "SHOPHOUSE",
  "đất nền": "LAND",
  "land": "LAND",
  "văn phòng": "OFFICE",
  "office": "OFFICE",
};

const STATUS_MAP: Record<string, string> = {
  "còn": "AVAILABLE",
  "available": "AVAILABLE",
  "giữ": "HOLD",
  "hold": "HOLD",
  "đặt cọc": "BOOKED",
  "booked": "BOOKED",
  "đã bán": "SOLD",
  "sold": "SOLD",
  "không bán": "UNAVAILABLE",
  "unavailable": "UNAVAILABLE",
};

/**
 * Parse raw rows from Excel/CSV into validated property data.
 * `projectId` must be provided separately since Excel won't have UUIDs.
 */
export function parseImportData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawRows: Record<string, any>[],
  defaultProjectId: string
): ImportResult {
  const valid: ImportRow[] = [];
  const errors: ImportError[] = [];

  if (rawRows.length === 0) {
    return { valid, errors, totalRows: 0 };
  }

  // Map headers
  const sampleKeys = Object.keys(rawRows[0]);
  const fieldMap: Record<string, keyof ImportRow> = {};
  for (const key of sampleKeys) {
    const normalized = key.toLowerCase().trim();
    if (COLUMN_MAP[normalized]) {
      fieldMap[key] = COLUMN_MAP[normalized];
    }
  }

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNum = i + 2; // 1-indexed + header row

    // Build mapped row
    const mapped: Record<string, unknown> = {};
    for (const [origKey, field] of Object.entries(fieldMap)) {
      let val = raw[origKey];
      if (val === undefined || val === null || val === "") continue;

      // Normalize type/status values
      if (field === "propertyType" && typeof val === "string") {
        val = TYPE_MAP[val.toLowerCase().trim()] || val.toUpperCase();
      }
      if (field === "status" && typeof val === "string") {
        val = STATUS_MAP[val.toLowerCase().trim()] || val.toUpperCase();
      }

      mapped[field] = val;
    }

    // Set defaults
    if (!mapped.projectId) mapped.projectId = defaultProjectId;
    if (!mapped.status) mapped.status = "AVAILABLE";

    // Validate with Zod
    const result = propertyCreateSchema.safeParse(mapped);
    if (result.success) {
      valid.push(result.data as ImportRow);
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          row: rowNum,
          field: issue.path.join("."),
          message: issue.message,
        });
      }
    }
  }

  return { valid, errors, totalRows: rawRows.length };
}

/** Generate template headers for download */
export function getTemplateHeaders(): string[] {
  return [
    "Mã căn", "Tòa", "Tầng", "Căn", "Loại",
    "Diện tích", "Phòng ngủ", "Phòng tắm", "Hướng", "View",
    "Giá", "Trạng thái",
  ];
}

/** Generate a sample row for the template */
export function getTemplateSampleRow(): (string | number)[] {
  return [
    "A-12-01", "A", 12, "01", "Căn hộ",
    75.5, 2, 2, "Đông Nam", "Hồ bơi",
    3500000000, "Còn",
  ];
}
