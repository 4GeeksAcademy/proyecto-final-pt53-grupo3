import React, { useState } from "react";

export const AddNote = () => {
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
        setTitle("");
        setContent("");
        setTags([]);
        setIsAnonymous(false);
        
        window.location.href = "/";
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
    <main className="container-fluid flex-grow-1 py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="card shadow-lg">
              <div className="card-body p-5">
                <h2 className="text-center mb-4">Create New Note</h2>
                
                <div className="mb-4">
                  <input
                    type="text"
                    className="form-control form-control-lg border-0 fs-3"
                    placeholder="Write a title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-4">
                  <textarea
                    className="form-control border-0"
                    rows="8"
                    placeholder="What do you want to share?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Tags</label>
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

                <div className="form-check mb-4">
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
                  className="btn btn-dark btn-lg w-100"
                  onClick={handlePublish}
                  disabled={isLoading || !title.trim() || !content.trim()}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Publishing...
                    </>
                  ) : (
                    'Publish'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};