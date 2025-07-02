'use client';
import { useState } from 'react';

export default function CreateGroupModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-neutral-900">
        <h2 className="mb-4 text-xl font-bold">Create New Group</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({ name, description });
            setName('');
            setDescription('');
          }}
        >
          <div className="mb-4">
            <label className="mb-1 block font-medium">Group Name</label>
            <input
              type="text"
              className="w-full rounded border px-3 py-2 dark:bg-neutral-800"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block font-medium">Description</label>
            <textarea
              className="w-full rounded border px-3 py-2 dark:bg-neutral-800"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded bg-gray-200 px-4 py-2 dark:bg-neutral-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
