/*
Purpose: This modal component allows users to manage existing tags by editing their names and colors,
or deleting them with confirmation dialogs.

Variables Summary:
- isOpen: Boolean for modal visibility.
- onClose: Function to close the modal.
- allTags: Array of all tags to display and manage.
- onDeleteTag: Function to delete a tag.
- onEditTag: Function to update a tag.
- deletingTag: Local state for the tag being deleted (confirmation modal).
- editingTag: Local state for the tag being edited.
- editedName: Local state for the edited tag name.
- editedColor: Local state for the edited tag color.

These variables handle the state for editing and deleting tags within the modal.
*/

import React, { useState } from 'react';
import { X, Trash2, Pencil } from 'lucide-react';
import { Tag } from '@/app/types/task';

interface EditTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTags: Tag[];
  onDeleteTag?: (tag: Tag) => void;
  onEditTag?: (tag: Tag) => void;
}

const TAG_COLORS = [
  { label: 'Blue',   value: '#2563EB' },
  { label: 'Green',  value: '#16A34A' },
  { label: 'Orange', value: '#EA580C' },
  { label: 'Red',    value: '#DC2626' },
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Pink',   value: '#DB2777' },
  { label: 'Yellow', value: '#D4B84A' },
  { label: 'Black',  value: '#000000' },
  { label: 'Gray',   value: '#374151' },
];

const EditTagModal: React.FC<EditTagModalProps> = ({
  isOpen,
  onClose,
  allTags,
  onDeleteTag,
  onEditTag
}) => {
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedColor, setEditedColor] = useState('');

  if (!isOpen) return null;

  const handleDeleteClick = (t: Tag, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTag(t);
  };

  const handleEditClick = (t: Tag, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTag(t);
    setEditedName(t.name);
    setEditedColor(t.color);
  };

  const handleSaveEdit = () => {
    if (editingTag && onEditTag && editedName.trim()) {
      onEditTag({ ...editingTag, name: editedName.trim(), color: editedColor });
      setEditingTag(null);
    }
  };

  const confirmDelete = () => {
    if (deletingTag && onDeleteTag) {
      onDeleteTag(deletingTag);
      setDeletingTag(null);
    }
  };

  return (
    <>
      {/* Main modal */}
      <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="modal-panel max-w-sm w-full">
          <div
            className="px-5 py-4 border-b border-border-subtle flex justify-between items-center rounded-t-[1.25rem]"
            style={{ backgroundColor: 'var(--tm-surface)' }}
          >
            <h3 className="text-lg font-semibold text-text-primary">Manage Tags</h3>
            <button onClick={onClose} className="btn btn-ghost" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              {allTags.map((t) => (
                <div key={t.id} className="relative group">
                  <div
                    style={{ backgroundColor: t.color }}
                    className="px-4 py-3 rounded-xl shadow-sm text-white font-medium text-sm text-center transition-all group-hover:shadow-md"
                  >
                    {t.name}
                  </div>
                  {/* Edit — top-left */}
                  <button
                    type="button"
                    onClick={(e) => handleEditClick(t, e)}
                    className="absolute -top-2 -left-2 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                    style={{ backgroundColor: 'var(--tm-accent)' }}
                    title="Edit tag"
                    aria-label={`Edit ${t.name}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  {/* Delete — top-right */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(t, e)}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                    style={{ backgroundColor: 'var(--tm-danger)' }}
                    title="Delete tag"
                    aria-label={`Delete ${t.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {deletingTag && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-[60]">
          <div className="modal-panel max-w-sm w-full p-6 space-y-4">
            <p className="text-center text-text-primary">
              Are you sure you want to delete the tag{' '}
              <span
                className="chip text-white font-medium"
                style={{ backgroundColor: deletingTag.color }}
              >
                {deletingTag.name}
              </span>
              ?
            </p>
            <p className="text-center text-sm text-text-muted">This action cannot be undone.</p>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeletingTag(null)}
                className="btn btn-secondary flex-1 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="btn flex-1 py-2 text-white"
                style={{ backgroundColor: 'var(--tm-danger)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit tag sub-modal */}
      {editingTag && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-[60]">
          <div className="modal-panel max-w-sm w-full">
            <div
              className="px-5 py-4 border-b border-border-subtle flex justify-between items-center rounded-t-[1.25rem]"
              style={{ backgroundColor: 'var(--tm-surface)' }}
            >
              <h3 className="text-lg font-semibold text-text-primary">Edit Tag</h3>
              <button onClick={() => setEditingTag(null)} className="btn btn-ghost" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Tag Name</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="input-field"
                  placeholder="Enter tag name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Tag Color</label>
                <div className="flex gap-3 items-center">
                  <select
                    value={editedColor}
                    onChange={(e) => setEditedColor(e.target.value)}
                    className="input-field flex-1"
                  >
                    {TAG_COLORS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <div
                    style={{ backgroundColor: editedColor }}
                    className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="btn btn-secondary flex-1 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editedName.trim()}
                  className="btn btn-primary flex-1 py-2"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditTagModal;
