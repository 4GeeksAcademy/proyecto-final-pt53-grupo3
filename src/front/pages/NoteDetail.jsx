import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const NoteDetail = () => {
  const [commentText, setCommentText] = useState("");
  const [note, setNote] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState({});

  // Estados para la edición de comentarios 
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState("");

  // Se cambió "noteId" a "id" para que coincida con la URL de Home
  const { id } = useParams();
  const navigate = useNavigate();

  // Se usa una URL de backend hardcodeada para evitar el error de import.meta.env
  // Asegúrate de que esta URL sea la correcta para tu servidor backend.
  const API_URL = "https://laughing-waddle-q7669w6g9pqjfxpv6-3001.app.github.dev/";

  // Función para obtener los comentarios 
  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notes/${id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.reverse());
        
        // Obtener votos del usuario para los comentarios
        const token = localStorage.getItem("token");
        if (token) {
          const votePromises = data.map(comment => 
            getUserVoteForComment(comment.comment_id)
          );
          
          const votes = await Promise.all(votePromises);
          const votesMap = {};
          data.forEach((comment, index) => {
            votesMap[comment.comment_id] = votes[index];
          });
          
          setUserVotes(prev => ({...prev, ...votesMap}));
        }
      } else {
        console.error("Error al obtener los comentarios.");
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
    }
  };

  // Función para obtener los detalles de la nota 
  const fetchNote = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setNote(data);
        
        // Obtener voto del usuario para la nota
        const token = localStorage.getItem("token");
        if (token) {
          const userVote = await getUserVoteForNote(id);
          setUserVotes(prev => ({...prev, [id]: userVote}));
        }
      } else {
        console.error("Error al obtener la nota.");
        setNote(null);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      setNote(null);
    }
  };

  // Función para obtener el voto del usuario para una nota
  const getUserVoteForNote = async (noteId) => {
    const token = localStorage.getItem("token");
    if (!token) return 0;
    
    try {
      const response = await fetch(`${API_URL}/api/votes/my-vote?note_id=${noteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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

  // Función para obtener el voto del usuario para un comentario
  const getUserVoteForComment = async (commentId) => {
    const token = localStorage.getItem("token");
    if (!token) return 0;
    
    try {
      const response = await fetch(`${API_URL}/api/votes/my-vote?comment_id=${commentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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

  // Función para obtener el usuario actual 
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      } else {
        console.error("Error al obtener el usuario actual.");
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setCurrentUser(null);
    }
  };

  // Función para manejar el voto
  const handleVote = async (elementId, voteType, isNote = true) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para votar");
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [isNote ? 'note_id' : 'comment_id']: elementId,
          vote_type: voteType
        })
      });
      
      if (response.ok) {
        // Actualizar el estado local del voto
        setUserVotes(prev => ({
          ...prev,
          [elementId]: userVotes[elementId] === voteType ? 0 : voteType
        }));
        
        // Recargar la nota y comentarios para actualizar los contadores
        if (isNote) {
          fetchNote();
        } else {
          fetchComments();
        }
      } else {
        const errorData = await response.json();
        alert(`Error al votar: ${errorData.msg}`);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("Ocurrió un error inesperado al votar");
    }
  };

  // Carga inicial de datos 
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchNote(),
        fetchComments(),
        fetchCurrentUser()
      ]);
      setIsLoading(false);
    };

    loadData();

  }, [id]);

  // Manejador para el cambio de comentario 
  const handleCommentChange = (e) => {
    setCommentText(e.target.value);
  };

  // Función para comentar la nota 
  const handlePostComment = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para comentar.");
      return;
    }
    if (!commentText.trim()) {
      alert("El comentario no puede estar vacío.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/notes/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText })
      });
      if (response.ok) {
        alert("Comentario publicado exitosamente!");
        setCommentText("");
        fetchComments();
      } else {
        const errorData = await response.json();
        alert(`Error al publicar el comentario: ${errorData.msg}`);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("Ocurrió un error inesperado al publicar el comentario.");
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container mt-4 text-center">
        <h2>Nota no encontrada</h2>
        <p>Lo sentimos, la nota que buscas no existe o ha sido eliminada.</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>Volver al inicio</button>
      </div>
    );
  }

  // Función para eliminar la nota 
  const deleteNote = async () => {
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar esta nota?");
    if (!confirmDelete) {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para poder eliminar notas.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        alert("Nota eliminada exitosamente!");
        navigate("/");
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar la nota: ${errorData.msg}`);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("Ocurrió un error inesperado al eliminar la nota.");
    }
  };

  // Lógica para renderizar el botón de eliminar nota 
  const canDeleteNote = currentUser && note && currentUser.id === note.user_id;

  // Lógica y funciones para editar comentarios 
  const handleEditComment = (commentId, currentContent) => {
    setEditingCommentId(commentId);
    setEditedContent(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedContent("");
  };

  const handleSaveEdit = async (commentId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para editar comentarios.");
      return;
    }

    if (!editedContent.trim()) {
      alert("El comentario no puede estar vacío.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: editedContent }),
      });

      if (response.ok) {
        fetchComments();
        setEditingCommentId(null);
        setEditedContent("");
        alert("Comentario actualizado exitosamente.");
      } else {
        const errorData = await response.json();
        alert(`Error al actualizar el comentario: ${errorData.msg || errorData.error}`);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("Ocurrió un error inesperado.");
    }
  };

  // Lógica y función para eliminar comentarios 
  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Debes iniciar sesión para eliminar comentarios.");
      return;
    }

    if (!window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) return;

    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        fetchComments();
        alert("Comentario eliminado exitosamente.");
      } else if (response.status === 403) {
        alert("No tienes permisos para eliminar este comentario.");
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar el comentario: ${errorData.msg || errorData.error}`);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("Ocurrió un error inesperado.");
    }
  };

  // Función para obtener el ID del usuario del token 
  const getCurrentUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ? payload.sub.toString() : null;
    } catch (error) {
      console.error("Error decodificando token:", error);
      return null;
    }
  };

  const currentUserId = getCurrentUserId();
  const isCommentAuthor = (commentUserId) => currentUserId && commentUserId.toString() === currentUserId;

  return (
    <div className="row">
      <div className="col-6 mt-5 m-auto bg-secondary-subtle rounded-strong">
        <div className="text-end mt-2 me-3">
          {canDeleteNote && (
            <button className="btn" onClick={deleteNote}> <i className="fa-solid fa-circle-xmark"></i></button>
          )}
        </div>

        <h1 className="ms-5">{note.title}</h1>

        {/* Renderizado condicional si la nota es anónima o no */}
        {!note.is_anonymous && note.user_info && (
          <p className="ms-5">
            Publicado por: <strong>{note.user_info.username}</strong>
          </p>
        )}
        <p className="m-2">{note.content}</p>
        
        {/* Botones de votación para la nota */}
        <div className="d-flex gap-2 mb-3 ms-2">
          <button 
            className={`btn btn-sm ${userVotes[id] === 1 ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => handleVote(id, 1, true)}
            title="Votar positivamente"
          >
            <i className="fas fa-thumbs-up"></i>
            <span className="ms-1">{note.positive_votes || 0}</span>
          </button>
          
          <button 
            className={`btn btn-sm ${userVotes[id] === -1 ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => handleVote(id, -1, true)}
            title="Votar negativamente"
          >
            <i className="fas fa-thumbs-down"></i>
            <span className="ms-1">{note.negative_votes || 0}</span>
          </button>
        </div>
        
        <div className="d-flex justify-content-end">
          {note.tags && note.tags.map(tag => (
            <button key={tag.tag_id} type="button" className="btn btn-outline-primary m-1">
              {tag.name}
            </button>
          ))}
        </div>
        
        <div className="mb-3">
          <label htmlFor="exampleFormControlTextarea1" className="form-label">
            <strong>Agregar un comentario</strong>
          </label>
          <textarea
            className="form-control"
            id="exampleFormControlTextarea1"
            rows="3"
            placeholder="En que estas pensando?"
            value={commentText}
            onChange={handleCommentChange}
          ></textarea>
          <button onClick={handlePostComment} className="btn btn-primary mt-2">
            Publicar
          </button>
        </div>
        
        <div>
          <p className="text-center"> Comentarios ({comments.length})</p>
          {comments.map((comment) => (
            <div key={comment.comment_id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="card-subtitle text-muted ">
                    {comment.first_name} {comment.last_name} (@{comment.username})
                  </h6>
                  
                  {/* Botones de votación para comentarios */}
                  <div className="d-flex gap-1 me-2">
                    <button 
                      className={`btn btn-sm ${userVotes[comment.comment_id] === 1 ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => handleVote(comment.comment_id, 1, false)}
                      title="Votar positivamente"
                    >
                      <i className="fas fa-thumbs-up"></i>
                    </button>
                    
                    <button 
                      className={`btn btn-sm ${userVotes[comment.comment_id] === -1 ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => handleVote(comment.comment_id, -1, false)}
                      title="Votar negativamente"
                    >
                      <i className="fas fa-thumbs-down"></i>
                    </button>
                  </div>
                </div>

                {/* Botones de editar y eliminar */}
                {isCommentAuthor(comment.user_id) && (
                  <div className="btn-group mb-2">
                    {editingCommentId !== comment.comment_id && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditComment(comment.comment_id, comment.content)}
                        >Editar</button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteComment(comment.comment_id)}
                        >Eliminar</button>
                      </>
                    )}
                  </div>
                )}

                {editingCommentId === comment.comment_id ? (
                  <>
                    <textarea
                      className="form-control mb-2"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows="3"
                    />
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-success" onClick={() => handleSaveEdit(comment.comment_id)}>Guardar</button>
                      <button className="btn btn-sm btn-secondary" onClick={handleCancelEdit}>Cancelar</button>
                    </div>
                  </>
                ) : (
                  <p className="card-text">{comment.content}</p>
                )}

                <small className="text-muted">
                  {new Date(comment.created_at).toLocaleString()}
                  {comment.updated_at && comment.updated_at !== comment.created_at &&
                    ` · Editado: ${new Date(comment.updated_at).toLocaleString()}`}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;