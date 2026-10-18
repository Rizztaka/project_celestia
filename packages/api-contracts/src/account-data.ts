/** Stored scalars use PostgreSQL text; SQL NULL is JSON null. JSON columns contain
 * JSON text, avoiding loss of numeric precision or interpretation of legacy data. */
export type StoredAccountRow = Record<string, string | null>;
export interface AccountExportV1 {
  exportVersion: 1;
  exportedAt: string;
  encoding: 'postgresql-text-v1';
  scope: string;
  omissions: string[];
  tables: Record<string, StoredAccountRow[]>;
}
export interface AccountExportRequest {
  requestVersion: 1;
  password: string;
}
export interface AccountDeleteRequest extends AccountExportRequest {
  confirmation: 'DELETE MY CELESTIA ACCOUNT';
}
export interface AccountDeleteResponse {
  responseVersion: 1;
  deleted: true;
}
