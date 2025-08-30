import React, { useEffect } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { NoteGrid } from "../components/NotesGrid.jsx";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();

  const loadNotes = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) throw new Error("VITE_BACKEND_URL is not defined in .env file");

      const response = await fetch(backendUrl + "/api/notes");
      const notes = await response.json();

      if (response.ok) {
        dispatch({ type: "set_notes", payload: notes });
      }

      return notes;
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  return (
    <main className="container-fluid flex-grow-1 py-4">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="display-4">Welcome to NotesApp</h1>
          <p className="lead">Share your thoughts with the community</p>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Community Notes</h2>
            <small className="text-muted">
              {store.notes ? `${store.notes.length} notes` : 'Loading...'}
            </small>
          </div>
          
          <NoteGrid 
            notes={store.notes} 
            loading={!store.notes}
          />
        </div>

        <div className="text-center mt-5">
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => navigate("/add-note")}
          >
            <i className="fas fa-plus me-2"></i>
            Add a New Note!
          </button>
        </div>
      </div>
    </main>
  );
};