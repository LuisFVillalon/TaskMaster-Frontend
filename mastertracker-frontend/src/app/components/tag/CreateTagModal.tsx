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
import { NewTagForm } from '@/app/types/task';

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTag: NewTagForm;
  onTagChange: (tag: NewTagForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CreateTagModal: React.FC<CreateTagModalProps> = ({
  isOpen,
  onClose,
  newTag,
  onTagChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="border-blue-600 border-4 bg-white rounded-2xl shadow-xl max-w-sm w-full">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg text-black font-semibold">Create A Tag</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="p-5 space-y-4">
            {/* Tag Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Name
              </label>
              <input
                type="text"
                value={newTag.name}
                onChange={(e) =>
                  onTagChange({ ...newTag, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="e.g. Work"
              />
            </div>

            {/* Color Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <select
                value={newTag.color}
                onChange={(e) =>
                  onTagChange({ ...newTag, color: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="#2563EB">Blue</option>
                <option value="#16A34A">Green</option>
                <option value="#EA580C">Orange</option>
                <option value="#DC2626">Red</option>
                <option value="#7C3AED">Purple</option>
                <option value="#DB2777">Pink</option>
                <option value="#D4B84A">Yellow</option>
                <option value="#000000">Black</option>
                <option value="#374151">Gray</option>
              </select>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Preview:</span>
              <span
                className="px-3 py-1 rounded-md text-white text-sm font-medium"
                style={{ backgroundColor: newTag.color }}
              >
                {newTag.name || 'Tag'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-black border border-gray-300 rounded-lg py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
              >
                Create Tag
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTagModal;