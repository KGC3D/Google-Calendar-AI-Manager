'use client';

import type { ActionPreview } from '@/lib/types';

interface ActionPreviewModalProps {
  preview: ActionPreview;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
}

export default function ActionPreviewModal({
  preview,
  onConfirm,
  onCancel,
  confirming,
}: ActionPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          Preview:{' '}
          <span className="capitalize text-blue-600">{preview.actionType}</span> Event
        </h2>

        {preview.warnings.length > 0 && (
          <div className="mb-3 rounded-md bg-yellow-50 p-3 text-xs text-yellow-800">
            {preview.warnings.map((w, i) => (
              <p key={i}>⚠ {w}</p>
            ))}
          </div>
        )}

        {preview.before && (
          <div className="mb-2">
            <p className="mb-1 text-xs font-medium text-gray-500">Before</p>
            <pre className="overflow-auto rounded-md bg-red-50 p-2 text-xs text-red-800">
              {JSON.stringify(preview.before, null, 2)}
            </pre>
          </div>
        )}

        <div className="mb-4">
          <p className="mb-1 text-xs font-medium text-gray-500">After</p>
          <pre className="overflow-auto rounded-md bg-green-50 p-2 text-xs text-green-800">
            {JSON.stringify(preview.after, null, 2)}
          </pre>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={confirming}
            className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={confirming}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {confirming ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
