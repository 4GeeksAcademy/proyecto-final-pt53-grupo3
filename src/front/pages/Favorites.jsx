import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const Favorites = () => {
  const { store, actions } = useGlobalReducer();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si el usuario tiene token
    if (!localStorage.getItem("token")) {
      alert("Debes iniciar sesión para ver tus favoritos");
      navigate("/login");
      return;
    }

    // Cargar favoritos al entrar a la página
    actions.getFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si no hay favoritos
  if (!store.favorites || store.favorites.length === 0) {
    return (
      <div className="container mt-4 text-center">
        <h2>No tienes favoritos aún ⭐</h2>
        <p>Explora notas y agrega algunas a tu lista.</p>
        <Link to="/" className="btn btn-primary">Ir a Notas</Link>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Mis Favoritos ⭐</h2>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {store.favorites.map((note) => (
          <div key={note.note_id || note.id} className="col">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title text-truncate">
                  {note.title || "Sin título"}
                </h5>
                <p className="card-text text-muted">
                  {note.content
                    ? note.content.substring(0, 100) + "..."
                    : "Sin contenido"}
                </p>
                <Link
                  to={`/noteDetail/${note.note_id || note.id}`}
                  className="btn btn-outline-primary btn-sm"
                >
                  Ver nota
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
