import React from "react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src="/logo.png" alt="Logo" width="30" height="30" className="d-inline-block align-text-top me-2" />
          NotesApp
        </Link>
        
        <div className="navbar-nav ms-auto">
          <form className="d-flex me-3" role="search">
            <input 
              className="form-control me-2" 
              type="search" 
              placeholder="Search notes..." 
              aria-label="Search"
            />
          </form>
          <Link className="nav-link" to="/add-note">
            <button className="btn btn-primary btn-sm">Add Note</button>
          </Link>
        </div>
      </div>
    </nav>
  );
};