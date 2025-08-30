import React from "react";

export const NoteGrid = ({ notes, loading }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1} a las ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          {[...Array(3)].map((_, colIndex) => (
            <div key={colIndex} className="col-md-4">
              <div className="card mb-3">
                <div className="card-body">
                  <div className="placeholder-glow">
                    <h5 className="card-title placeholder col-8"></h5>
                    <p className="card-text placeholder col-12"></p>
                    <p className="card-text placeholder col-10"></p>
                    <p className="card-text placeholder col-6"></p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="alert alert-info text-center">
        <h4>No notes yet</h4>
        <p>Be the first to share something with the community!</p>
        <a href="/add-note" className="btn btn-primary">Create First Note</a>
      </div>
    );
  }

  const columns = [[], [], []];
  notes.forEach((note, index) => {
    columns[index % 3].push(note);
  });

  return (
    <div className="container-fluid">
      <div className="row">
        {columns.map((columnNotes, colIndex) => (
          <div key={colIndex} className="col-md-4">
            {columnNotes.map((note) => (
              <div key={note.note_id} className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title">{note.title}</h5>
                  <p className="card-text">{note.content.substring(0, 150)}...</p>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">
                      By: {note.user?.username || 'Anonymous'}
                    </small>
                    <small className="text-muted">
                      {note.created_at_formatted || formatDate(note.created_at)}
                    </small>
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-2">
                      {note.tags.map(tag => (
                        <span 
                          key={tag.tag_id} 
                          className="badge bg-secondary me-1 mb-1"
                          style={{ backgroundColor: tag.color_hex || '#6c757d' }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};