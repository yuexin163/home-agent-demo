export interface Space {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  gallery: string[];
  materialIds: string[];
  documentIds: string[];
  designConcept: string;
  highlights: string[];
  visualMode?: "concept" | "product-preview";
  visualLabel?: string;
}

export interface Material {
  id: string;
  spaceId: string;
  category: string;
  name: string;
  brand: string;
  model: string;
  specification: string;
  material: string;
  color: string;
  description: string;
  coverImage: string;
  gallery: string[];
  documentIds: string[];
  available: boolean;
  recommendedProductId?: string;
}

export type ProductCategory = "地板" | "软装" | "定制柜体" | "厨房电器" | "卫浴" | "厨卫五金";

export interface ShowcaseProduct {
  id: string;
  category: ProductCategory;
  subcategory: string;
  name: string;
  brand: string;
  model: string;
  specification: string;
  description: string;
  coverImage: string;
  gallery: string[];
  displayPrice: string;
  priceLabel: string;
  suitableSpaces: string[];
  tags: string[];
  sourceSheet: string;
  sourceRow: number;
  sourceStatus: "产品资料已归档";
}

export interface SpaceMaterialSelection {
  id: string;
  spaceId: string;
  materialId: string;
  category: ProductCategory;
  recommendedProductId: string;
  alternativeProductIds: string[];
  applicationArea: string;
  status: "方案推荐";
  reason: string;
  dataStatus: string;
}

export interface SelectionSlot {
  id: string;
  spaceId: string;
  name: string;
  categoryLabel: string;
  libraryCategory?: ProductCategory;
  description: string;
  productIds: string[];
  recommendedProductId?: string;
}

export interface HomeManualRoom {
  id: string;
  name: string;
  area: string;
  description: string;
}

export interface InstalledEquipment {
  id: string;
  productId: string;
  spaceId: string;
  installLocation: string;
  installedAt: string;
  warranty: string;
  maintenance: string;
  status: "在册设备";
}

export interface HomeManual {
  property: {
    name: string;
    location: string;
    buildingArea: string;
    layout: string;
    orientation: string;
    floor: string;
    style: string;
    completionDate: string;
    dataStatus: string;
  };
  rooms: HomeManualRoom[];
  installedEquipment: InstalledEquipment[];
}

export type ManualDocumentKind = "house" | "equipment";

export interface ManualDocument {
  id: string;
  kind: ManualDocumentKind;
  zone: string;
  deviceName: string | null;
  title: string;
  model: string | null;
  summary: string;
  keywords: string[];
  pdfUrl: string;
  coverImage: string;
  pageCount: number;
  fileSize: string;
  searchablePageCount: number;
  sourceFile: string;
}

export interface ManualSourceSummary {
  housePdfCount: number;
  equipmentPdfCount: number;
  equipmentDeviceCount: number;
  equipmentZones: string[];
  note: string;
}

export interface ManualLibrary {
  sourceSummary: ManualSourceSummary;
  documents: ManualDocument[];
}

export interface ManualSearchPage {
  documentId: string;
  page: number;
  text: string;
}

export type DocumentCategory = "装修方案" | "产品说明书" | "验房报告" | "物料清单";

export interface ProjectDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  spaceId: string | null;
  materialId: string | null;
  fileType: string;
  fileUrl: string;
  thumbnail: string;
  description: string;
  status: "资料已归档" | "资料完善中";
}
