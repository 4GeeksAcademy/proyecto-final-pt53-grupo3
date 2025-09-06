import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export const Home = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  {/* Si hay errores de Fetch, cambien el BackendUrl al de su puerto y deberia solucionarse */}
  const backendUrl = "https://laughing-waddle-q7669w6g9pqjfxpv6-3001.app.github.dev/";

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}api/notes`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Ordenar notas por fecha de creación (más recientes primero)
      const sortedNotes = data.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date);
        const dateB = new Date(b.created_at || b.date);
        return dateB - dateA; // Orden descendente (más nuevo primero)
      });
      
      setNotes(sortedNotes);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para truncar texto muy largo
  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Función para formatear la fecha en formato "Día/Mes Hora"
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    
    try {
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      // Obtener día, mes, horas y minutos
      const day = date.getDate();
      const month = date.getMonth() + 1; // Los meses van de 0-11
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      // Formatear a 2 dígitos
      const formattedDay = day < 10 ? `0${day}` : day;
      const formattedMonth = month < 10 ? `0${month}` : month;
      const formattedHours = hours < 10 ? `0${hours}` : hours;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      
      return `${formattedDay}/${formattedMonth} ${formattedHours}:${formattedMinutes}`;
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Error en fecha";
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando notas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error al cargar las notas</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchNotes}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h2">Notas de la Comunidad</h1>
            <span className="badge bg-secondary">
              {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
            </span>
          </div>
          <p className="text-muted">
            Descubre lo que la comunidad está compartiendo
          </p>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="fas fa-sticky-note fa-4x text-muted"></i>
          </div>
          <h3 className="text-muted">No hay notas todavía</h3>
          <p className="text-muted">Sé el primero en compartir algo con la comunidad</p>
          <Link to="/" className="btn btn-primary">
            Crear primera nota
          </Link>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {notes.map((note) => (
            <div key={note.note_id || note.id} className="col">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title text-truncate" title={note.title}>
                      {note.title || "Sin título"}
                    </h5>
                    {note.is_anonymous && (
                      <span className="badge bg-info ms-2">Anónimo</span>
                    )}
                  </div>

                  <p className="card-text text-muted">
                    {truncateText(note.content)}
                  </p>

                  {note.tags && note.tags.length > 0 && (
                    <div className="mb-3">
                      <div className="d-flex flex-wrap gap-1">
                        {note.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="badge bg-primary"
                            style={{ fontSize: '0.75rem' }}
                          >
                            {typeof tag === 'object' ? tag.name : tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto">
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      {formatDate(note.created_at || note.date)}
                    </small>
                    
                    {note.user && !note.is_anonymous && (
                      <div className="mt-1">
                        <small className="text-muted">
                          <i className="fas fa-user me-1"></i>
                          {note.user.username || 
                           (note.user.first_name && note.user.last_name 
                            ? `${note.user.first_name} ${note.user.last_name}` 
                            : 'Usuario')}
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-footer bg-transparent border-top-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <Link 
                      to={`/noteDetail/${note.note_id || note.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Leer más
                    </Link>
                    
                    <div className="d-flex gap-2">
                      <small className="text-muted">
                        <i className="fas fa-comment me-1"></i>
                        {note.comments_count || 0}
                      </small>
                      <small className="text-muted">
                        <i className="fas fa-heart me-1"></i>
                        {note.likes_count || 0}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <div className="text-center mt-5">
          <button className="btn btn-outline-secondary" disabled>
            Cargar más notas
          </button>
        </div>
      )}
    </div>
  );
};