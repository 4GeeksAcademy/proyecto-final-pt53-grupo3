import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Home = () => {
  // Estado global y acciones para favoritos
  const { store, actions } = useGlobalReducer();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [sortOption, setSortOption] = useState("recent"); // 'recent', 'voted', 'commented'
  const navigate = useNavigate();


  {/* Si hay errores de Fetch, cambien el BackendUrl al de su puerto y deberia solucionarse */}
  const backendUrl = "https://laughing-waddle-q7669w6g9pqjfxpv6-3001.app.github.dev/";



  useEffect(() => {
    fetchNotes();

    // Al montar el componente, cargar favoritos del usuario
    if (localStorage.getItem("token")) {
      actions.getFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTokenExpired = () => {
    localStorage.removeItem("token");
    alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
    navigate("/login");
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/notes`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setNotes(data);

      const token = localStorage.getItem("token");
      if (token) {
        try {
          const votePromises = data.map(note =>
            getUserVoteForNote(note.note_id || note.id)
          );

          const votes = await Promise.all(votePromises);
          const votesMap = {};
          data.forEach((note, index) => {
            votesMap[note.note_id || note.id] = votes[index];
          });

          setUserVotes(votesMap);
        } catch (voteError) {
          console.error("Error obteniendo votos:", voteError);
          setUserVotes({});
        }
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserVoteForNote = async (noteId) => {
    const token = localStorage.getItem("token");
    if (!token) return 0;

    try {
      const response = await fetch(`${backendUrl}api/votes/my-vote?note_id=${noteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleTokenExpired();
        return 0;
      }

      if (response.ok) {
        const data = await response.json();
        return data.vote_type;
      }
      return 0;
    } catch (error) {
      console.error("Error obteniendo voto:", error);
      return 0;
    }
  };

  const handleVote = async (noteId, voteType) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para votar");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}api/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          note_id: noteId,
          vote_type: voteType
        })
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        navigate("/login");
        return;
      }

      if (response.ok) {
        setUserVotes(prev => ({
          ...prev,
          [noteId]: prev[noteId] === voteType ? 0 : voteType
        }));

        setNotes(prevNotes =>
          prevNotes.map(note => {
            if (note.note_id === noteId || note.id === noteId) {
              const currentPositive = note.positive_votes || 0;
              const currentNegative = note.negative_votes || 0;
              const currentUserVote = userVotes[noteId] || 0;

              if (currentUserVote === voteType) {
                return {
                  ...note,
                  positive_votes: voteType === 1 ? Math.max(0, currentPositive - 1) : currentPositive,
                  negative_votes: voteType === -1 ? Math.max(0, currentNegative - 1) : currentNegative
                };
              } else if (currentUserVote === -voteType) {
                return {
                  ...note,
                  positive_votes: voteType === 1 ? currentPositive + 1 : Math.max(0, currentPositive - 1),
                  negative_votes: voteType === -1 ? currentNegative + 1 : Math.max(0, currentNegative - 1)
                };
              } else {
                return {
                  ...note,
                  positive_votes: voteType === 1 ? currentPositive + 1 : currentPositive,
                  negative_votes: voteType === -1 ? currentNegative + 1 : currentNegative
                };
              }
            }
            return note;
          })
        );
      } else {
        const errorData = await response.json();
        alert(`Error al votar: ${errorData.msg}`);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("Ocurrió un error inesperado al votar");
    }
  };

  // --- FAVORITOS ---
  const isNoteFavorited = (noteId) => {
    return store.favorites.some(fav => (fav.note_id || fav.id) === noteId);
  };

  const toggleFavorite = async (note) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para gestionar favoritos");
      navigate("/login");
      return;
    }

    const noteId = note.note_id || note.id;

    if (isNoteFavorited(noteId)) {
      // Quitar de favoritos
      await actions.removeFavorite(noteId);
    } else {
      // Agregar a favoritos
      await actions.addFavorite(noteId);
    }
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return "Fecha inválida";

      const day = date.getDate();
      const month = date.getMonth() + 1;
      const hours = date.getHours();
      const minutes = date.getMinutes();

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

  // Creamos el array ordenado según la opción seleccionada
  const sortedNotes = [...notes].sort((a, b) => {
    if (sortOption === "recent") {
      return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
    }
    if (sortOption === "voted") {
      const votesA = (a.positive_votes || 0) - (a.negative_votes || 0);
      const votesB = (b.positive_votes || 0) - (b.negative_votes || 0);
      return votesB - votesA;
    }
    if (sortOption === "commented") {
      return (b.comments_count || 0) - (a.comments_count || 0);
    }
    return 0;
  });

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
          <p className="text-muted">Descubre lo que la comunidad está compartiendo</p>
        </div>
      </div>

      {/* Filtro de ordenamiento */}
      <div className="mb-3 d-flex align-items-center gap-2">
        <label htmlFor="sortSelect" className="fw-semibold">Ordenar por:</label>
        <select
          id="sortSelect"
          className="form-select w-auto"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="recent">Más recientes</option>
          <option value="voted">Más votadas</option>
          <option value="commented">Más comentadas</option>
        </select>
      </div>

      <form className="form-inline my-2 my-lg-0">
        <input className="form-control mr-sm-2" type="search" placeholder="Buscar tags" aria-label="Search" />
        <button className="btn btn-outline-success my-2 my-sm-0" type="submit">Buscar</button>
      </form>

      {sortedNotes.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="fas fa-sticky-note fa-4x text-muted"></i>
          </div>
          <h3 className="text-muted">No hay notas todavía</h3>
          <p className="text-muted">Sé el primero en compartir algo con la comunidad</p>
          <Link to="/" className="btn btn-primary">Crear primera nota</Link>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {sortedNotes.map((note) => (
            <div key={note.note_id || note.id} className="col">
              <div className="card h-100 shadow-sm d-flex flex-column">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title text-truncate" title={note.title}>
                      {note.title || "Sin título"}
                    </h5>
                    {note.is_anonymous && (
                      <span className="badge bg-info ms-2">Anónimo</span>
                    )}
                  </div>

                  <p className="card-text text-muted">{truncateText(note.content)}</p>

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

                {/* Footer con botones de acción */}
                <div className="card-footer bg-transparent border-top-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <Link
                      to={`/noteDetail/${note.note_id || note.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Leer más
                    </Link>

                    <div className="d-flex gap-2 align-items-center">
                      {/* Botón Favoritos */}
                      <button
                        className={`btn btn-sm ${isNoteFavorited(note.note_id || note.id) ? 'btn-warning' : 'btn-outline-warning'}`}
                        onClick={() => toggleFavorite(note)}
                        title={isNoteFavorited(note.note_id || note.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                      >
                        <i className="fas fa-star"></i>
                      </button>

                      {/* Botón Voto positivo */}
                      <button
                        className={`btn btn-sm ${userVotes[note.note_id || note.id] === 1 ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => handleVote(note.note_id || note.id, 1)}
                        title="Votar positivamente"
                      >
                        <i className="fas fa-thumbs-up"></i>
                        <span className="ms-1">{note.positive_votes || 0}</span>
                      </button>

                      {/* Botón Voto negativo */}
                      <button
                        className={`btn btn-sm ${userVotes[note.note_id || note.id] === -1 ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={() => handleVote(note.note_id || note.id, -1)}
                        title="Votar negativamente"
                      >
                        <i className="fas fa-thumbs-down"></i>
                        <span className="ms-1">{note.negative_votes || 0}</span>
                      </button>

                      {/* Contador de comentarios */}
                      <small className="text-muted">
                        <i className="fas fa-comment me-1"></i>
                        {note.comments_count || 0}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedNotes.length > 0 && (
        <div className="text-center mt-5">
          <button className="btn btn-outline-secondary" disabled>
            Cargar más notas
          </button>
        </div>
      )}
    </div>
  );
};
