/*
Purpose: This modal component allows users to manage existing tags by editing their names and colors, 
or deleting them with confirmation dialogs.

Variables Summary:
- isOpen: Boolean for modal visibility.
- onClose: Function to close the modal.
- tag: Unused prop (possibly legacy).
- onTagChange: Unused prop.
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
  tag: Tag;
  onTagChange: (tag: Tag) => void;
  allTags: Tag[];
  onDeleteTag?: (tag: Tag) => void;
  onEditTag?: (tag: Tag) => void;
}

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
      const updatedTag = {
        ...editingTag,
        name: editedName.trim(),
        color: editedColor
      };
      onEditTag(updatedTag);
      setEditingTag(null);
      setEditedName('');
      setEditedColor('');
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
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="border-blue-600 border-4 bg-white p-2 rounded-2xl shadow-xl max-w-sm w-full">
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg text-black font-semibold">Manage Tags</h3>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {allTags.map((t) => (
                <div key={t.id} className="relative group">
                  <div
                    style={{ backgroundColor: t.color }}
                    className="px-4 py-3 rounded-lg shadow-sm text-white font-medium text-sm text-center transition-all hover:shadow-md"
                  >
                    {t.name}
                  </div>
                  {/* Edit button appears on hover - LEFT CORNER */}
                  <button
                    type="button"
                    onClick={(e) => handleEditClick(t, e)}
                    className="cursor-pointer absolute -top-2 -left-2 p-1.5 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:scale-110 shadow-lg"
                    title="Edit tag"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  {/* Delete button appears on hover - RIGHT CORNER */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(t, e)}
                    className="cursor-pointer absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg"
                    title="Delete tag"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTag && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-60 bg-opacity-50">
          <div className="border-blue-600 border-4 bg-white rounded-2xl shadow-xl max-w-sm w-full">
            <div className="p-6 space-y-4">
              <p className="text-center text-gray-700">
                Are you sure you want to delete the tag{' '}
                <span
                  style={{ backgroundColor: deletingTag.color }}
                  className="px-2 py-1 rounded text-white font-medium"
                >
                  {deletingTag.name}
                </span>
                ?
              </p>
              <p className="text-center text-sm text-gray-500">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingTag(null)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tag Modal */}
      {editingTag && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-60 bg-opacity-50">
          <div className="border-blue-600 border-4 bg-white rounded-2xl shadow-xl max-w-sm w-full">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg text-black font-semibold">Edit Tag</h3>
              <button onClick={() => setEditingTag(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Enter tag name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Color
                </label>
                <div className="flex gap-3 items-center">
                  <select
                    value={editedColor}
                    onChange={(e) => setEditedColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                  <div
                    style={{ backgroundColor: editedColor }}
                    className="w-10 h-10 rounded-lg border border-gray-300"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!editedName.trim()}
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