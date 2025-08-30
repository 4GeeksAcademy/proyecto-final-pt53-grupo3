import React, { useState } from "react";

export const NoteCard = ({ onNoteCreated }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please add a title and content");
      return;
    }

    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(backendUrl + "/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          is_anonymous: isAnonymous,
          tags: tags
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        
        setTitle("");
        setContent("");
        setTags([]);
        setIsAnonymous(false);
        
        if (onNoteCreated) {
          onNoteCreated(newNote);
        }
        
        alert("Note published successfully!");
      } else {
        throw new Error("Failed to publish note");
      }
    } catch (error) {
      console.error("Error publishing note:", error);
      alert("Error publishing note. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">Create New Note</h5>
        
        <div className="mb-3">
          <label htmlFor="noteTitle" className="form-label">Title</label>
          <input
            type="text"
            className="form-control"
            id="noteTitle"
            placeholder="What's the title of your note?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="noteContent" className="form-label">What do you want to share?</label>
          <textarea
            className="form-control"
            id="noteContent"
            rows="4"
            placeholder="Share your thoughts, ideas, or experiences..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Tags</label>
          <div className="input-group mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              disabled={isLoading}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleAddTag}
              disabled={isLoading}
            >
              Add Tag
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <span key={index} className="badge bg-primary d-flex align-items-center">
                  {tag}
                  <button
                    type="button"
                    className="btn-close btn-close-white ms-2"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isLoading}
                    aria-label="Remove tag"
                  />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="anonymousCheck"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            disabled={isLoading}
          />
          <label className="form-check-label" htmlFor="anonymousCheck">
            Post anonymously
          </label>
        </div>

        <button
          className="btn btn-primary w-100"
          onClick={handlePublish}
          disabled={isLoading || !title.trim() || !content.trim()}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Publishing...
            </>
          ) : (
            'Publish Note'
          )}
        </button>
      </div>
    </div>
  );
};