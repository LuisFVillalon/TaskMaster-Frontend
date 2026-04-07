/*
Purpose: This modal component provides a form for creating new tags, allowing users to enter a tag name and select
a color from predefined options.

Variables Summary:
- isOpen: Boolean indicating if the modal is visible.
- onClose: Function to close the modal.
- newTag: NewTagForm object containing the name and color of the tag being created.
- onTagChange: Function to update the newTag object as the user types or selects.
- onSubmit: Function to handle form submission and create the tag.

These variables manage the modal state and form data for tag creation.
*/

import React from 'react';
import { X } from 'lucide-react';
import { NewTag } from '@/app/types/task';

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTag: NewTag;
  onTagChange: (tag: NewTag) => void;
  onSubmit: (e: React.FormEvent) => void;
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

const CreateTagModal: React.FC<CreateTagModalProps> = ({
  isOpen,
  onClose,
  newTag,
  onTagChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="modal-panel max-w-sm w-full">
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-border-subtle flex justify-between items-center rounded-t-[1.25rem]"
          style={{ backgroundColor: 'var(--tm-surface)' }}
        >
          <h3 className="text-lg font-semibold text-text-primary">Create a Tag</h3>
          <button onClick={onClose} className="btn btn-ghost" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {/* Tag Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Tag Name</label>
            <input
              type="text"
              value={newTag.name}
              onChange={(e) => onTagChange({ ...newTag, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Work"
              required
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Color</label>
            <select
              value={newTag.color}
              onChange={(e) => onTagChange({ ...newTag, color: e.target.value })}
              className="input-field"
            >
              {TAG_COLORS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Preview:</span>
            <span
              className="chip text-white font-medium px-2"
              style={{
                backgroundColor: newTag.color,
                borderRadius: '10px'
              }}
            >
              {newTag.name || 'Tag'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1 py-2">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1 py-2">
              Create Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTagModal;
