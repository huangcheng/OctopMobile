import type { ApiClient } from "./http";
import type { KnowledgeBase, KnowledgeDocument } from "./types";

/** GET /api/knowledge-bases — bases visible to the current user (contract §9). */
export function listKnowledgeBases(
  api: Pick<ApiClient, "apiRequest">,
): Promise<KnowledgeBase[]> {
  return api.apiRequest<KnowledgeBase[]>("/api/knowledge-bases");
}

/** GET /api/knowledge-bases/{kb_id}/documents — document rows for one base. */
export function listKnowledgeDocuments(
  api: Pick<ApiClient, "apiRequest">,
  kbId: string,
): Promise<KnowledgeDocument[]> {
  return api.apiRequest<KnowledgeDocument[]>(
    `/api/knowledge-bases/${encodeURIComponent(kbId)}/documents`,
  );
}

export type DocumentPreview = { id: string; filename: string; text: string };

/** GET /api/knowledge-bases/{kb_id}/documents/{doc_id}/preview — extracted text. */
export function previewDocument(
  api: Pick<ApiClient, "apiRequest">,
  kbId: string,
  docId: string,
): Promise<DocumentPreview> {
  return api.apiRequest<DocumentPreview>(
    `/api/knowledge-bases/${encodeURIComponent(kbId)}/documents/${encodeURIComponent(docId)}/preview`,
  );
}
