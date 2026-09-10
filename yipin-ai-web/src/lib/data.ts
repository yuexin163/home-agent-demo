import spacesData from "@/src/data/spaces.json";
import materialsData from "@/src/data/materials.json";
import documentsData from "@/src/data/documents.json";
import showcaseProductsData from "@/src/data/showcase-products.json";
import spaceMaterialSelectionsData from "@/src/data/space-material-selections.json";
import selectionSlotsData from "@/src/data/selection-slots.json";
import homeManualData from "@/src/data/home-manual.json";
import manualDocumentsData from "@/src/data/manual-documents.json";
import customizationPlanData from "@/src/data/customization-plan.json";
import type { HomeManual, ManualLibrary, Material, ProjectDocument, SelectionSlot, ShowcaseProduct, Space, SpaceMaterialSelection } from "@/src/types/content";

export const spaces = spacesData as Space[];
export const materials = materialsData as Material[];
export const documents = documentsData as ProjectDocument[];
export const showcaseProducts = showcaseProductsData as ShowcaseProduct[];
export const spaceMaterialSelections = spaceMaterialSelectionsData as SpaceMaterialSelection[];
export const selectionSlots = selectionSlotsData as SelectionSlot[];
export const homeManual = homeManualData as HomeManual;
export const manualLibrary = manualDocumentsData as ManualLibrary;
export const customizationPlan = customizationPlanData;

export function getSpaceById(id: string) {
  return spaces.find((space) => space.id === id);
}

const legacySpaceToCustomizationSpace: Record<string, string> = {
  "living-dining": "living-dining",
  kitchen: "kitchen",
  bathroom: "shared-bathroom",
};

export function getCustomizationSpaceUrl(spaceId: string) {
  const targetSpaceId = legacySpaceToCustomizationSpace[spaceId] ?? spaceId;
  const exists = customizationPlan.spaces.some((space) => space.id === targetSpaceId);
  return exists ? `/materials?space=${targetSpaceId}` : "/materials";
}

export function getMaterialById(id: string) {
  return materials.find((material) => material.id === id);
}

export function getMaterialsBySpace(spaceId: string) {
  return materials.filter((material) => material.spaceId === spaceId);
}

export function getDocumentsByIds(ids: string[]) {
  return documents.filter((document) => ids.includes(document.id));
}

export function getShowcaseProductById(id: string) {
  return showcaseProducts.find((product) => product.id === id);
}

export function getRelatedShowcaseProducts(productId: string, category: string) {
  return showcaseProducts.filter((product) => product.id !== productId && product.category === category);
}

export function getSelectionByMaterialId(materialId: string) {
  return spaceMaterialSelections.find((selection) => selection.materialId === materialId);
}

export function getSelectionBySpaceAndCategory(spaceId: string, category: string) {
  return spaceMaterialSelections.find((selection) => selection.spaceId === spaceId && selection.category === category);
}

export function getSelectionSlotById(id: string) {
  return selectionSlots.find((slot) => slot.id === id);
}

export function getSelectionSlotsBySpace(spaceId: string) {
  return selectionSlots.filter((slot) => slot.spaceId === spaceId);
}

export function getSelectionSlotForProduct(productId: string) {
  return selectionSlots.find((slot) => slot.productIds.includes(productId));
}

export function getShowcaseProductsByIds(ids: string[]) {
  return showcaseProducts.filter((product) => ids.includes(product.id));
}

export function getManualDocumentById(id: string) {
  return manualLibrary.documents.find((document) => document.id === id);
}
