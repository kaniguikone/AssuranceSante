// ─── Types communs partagés entre tous les services ───────────────────────────

export type UUID = string;
export type FCFA = number; // Montant en francs CFA (entier, pas de décimales)
export type ISO8601 = string; // Format date: "2024-01-15T10:30:00Z"

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: ISO8601;
}

export type Gender = 'M' | 'F';

export type DocumentType = 'CNI' | 'PASSEPORT' | 'TITRE_SEJOUR' | 'PERMIS_CONDUIRE';

export interface Address {
  rue?: string;
  quartier?: string;
  commune: string;
  ville: string;
  region: string;
  pays: string;
  codePostal?: string;
}

export interface ContactInfo {
  telephone: string; // Format: +225XXXXXXXXXX
  telephoneSecondaire?: string;
  email?: string;
  adresse?: Address;
}

export interface AuditFields {
  createdAt: ISO8601;
  updatedAt: ISO8601;
  createdBy: UUID;
  updatedBy?: UUID;
}
