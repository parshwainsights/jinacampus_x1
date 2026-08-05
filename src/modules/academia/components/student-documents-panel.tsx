"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  STUDENT_DOCUMENT_LABELS,
  STUDENT_DOCUMENT_TYPES,
  type StudentDocumentTypeValue
} from "@/modules/academia/schemas/student-document.schema";

export type StudentDocumentListItem = {
  id: string;
  type: StudentDocumentTypeValue;
  title: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

function fileSizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StudentDocumentsPanel({
  studentId,
  documents,
  maxBytes
}: {
  studentId: string;
  documents: StudentDocumentListItem[];
  maxBytes: number;
}) {
  const router = useRouter();
  const [type, setType] = useState<StudentDocumentTypeValue>("PASSPORT_PHOTO");
  const [title, setTitle] = useState(STUDENT_DOCUMENT_LABELS.PASSPORT_PHOTO);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const maxMegabytes = (maxBytes / (1024 * 1024)).toFixed(1);

  function updateType(nextType: StudentDocumentTypeValue) {
    setType(nextType);
    setTitle(STUDENT_DOCUMENT_LABELS[nextType]);
  }

  async function upload() {
    if (!file) {
      setMessage("Choose a PDF, JPEG, PNG, or WebP file first.");
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.set("type", type);
      body.set("title", title);
      body.set("file", file);
      const response = await fetch(`/api/academia/students/${studentId}/documents`, {
        method: "POST",
        body
      });
      const result = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Upload failed.");
      setFile(null);
      setMessage("Document uploaded securely.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload this document.");
    } finally {
      setPending(false);
    }
  }

  async function remove(documentId: string) {
    if (!window.confirm("Delete this student document? This action is audited.")) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/academia/students/${studentId}/documents/${documentId}`,
        { method: "DELETE" }
      );
      const result = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Delete failed.");
      setMessage("Document deleted.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete this document.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="premium-card p-4">
      <div>
        <h2 className="text-base font-semibold text-slate-950">Admission Documents</h2>
        <p className="mt-1 text-sm text-slate-500">
          Private files are available only through permission-checked, short-lived links.
        </p>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Document type
          <select
            value={type}
            onChange={(event) => updateType(event.target.value as StudentDocumentTypeValue)}
            disabled={pending}
            className="mt-2 min-h-11 w-full"
          >
            {STUDENT_DOCUMENT_TYPES.map((option) => (
              <option key={option} value={option}>{STUDENT_DOCUMENT_LABELS[option]}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={pending}
            maxLength={120}
            className="mt-2 min-h-11 w-full"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          File
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={pending}
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
          />
        </label>
        <div className="md:col-span-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">PDF or image, up to {maxMegabytes} MB per file.</p>
          <button
            type="button"
            onClick={upload}
            disabled={pending || !file || !title.trim()}
            className="premium-primary-button min-h-11 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Uploading..." : "Upload document"}
          </button>
        </div>
      </div>

      {message ? (
        <p role="status" className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {documents.length ? documents.map((document) => (
          <div key={document.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{document.title}</p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {document.originalFileName} · {fileSizeLabel(document.sizeBytes)}
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/api/academia/students/${studentId}/documents/${document.id}`}
                target="_blank"
                rel="noreferrer"
                className="premium-secondary-button min-h-11"
              >
                View
              </a>
              <button
                type="button"
                onClick={() => remove(document.id)}
                disabled={pending}
                className="min-h-11 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        )) : (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No admission documents have been uploaded for this student.
          </p>
        )}
      </div>
    </section>
  );
}
