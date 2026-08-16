/**
 * 자산 관리 타입 정의
 */

export type AssetStatus = "owned" | "wtt" | "wts" | "wishlist";
export type AuthenticationStatus = "unverified" | "verified" | "in-progress";

export interface PhysicalLocation {
  id: string;
  label: string;
  category: "binder" | "sleeve" | "storage";
}

export interface AssetCard {
  id: string;
  cardId: string;
  cardName: string;
  memberName: string;
  groupName: string;
  imageUrl?: string;
  status: AssetStatus;
  authenticatedAt?: Date;
  authenticationStatus: AuthenticationStatus;
  location?: PhysicalLocation;
  purchasedAt?: Date;
  purchasePrice?: number;
  notes?: string;
}

export interface AssetActivityLog {
  id: string;
  assetCardId: string;
  action: "added" | "status-changed" | "authenticated" | "location-updated" | "note-added";
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BulkActionPayload {
  selectedCardIds: string[];
  action: "change-status" | "move-location" | "add-tag" | "delete";
  newValue?: AssetStatus | PhysicalLocation | string;
}
