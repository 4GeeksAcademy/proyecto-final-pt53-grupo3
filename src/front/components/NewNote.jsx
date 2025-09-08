import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useNavigate } from "react-router-dom";

export const NewNote = () => {
  const [content, setContent] = useState("");
  const textareaRef = useRef(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [title, setTitle] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [showLoginErrorModal, setShowLoginErrorModal] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Hook para obtener los tags de la API al cargar el componente
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tags`);
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data);
        } else {
          console.error("Error al obtener los tags.");
        }
      } catch (error) {
        console.error("Error en la conexión:", error);
      }
    };
    fetchTags();
  }, []);

  // Hook para ajustar el tamaño del textarea cuando cambia el contenido
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [content]);


  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleTagClick = (tagName) => {
    setSelectedTag(tagName === selectedTag ? null : tagName);
  };

  const handleClose = () => {
    setContent("");
    setTitle("");
    setSelectedTag(null);
    setShowLoginErrorModal(false);
  };


  const publishNote = async () => {
    // la recomendacion es que se use global reducer, pero lo vi muy complicado y lo deje asi
    const token = localStorage.getItem("token");

    // Verificamos que exista una sesion iniciada
    if (!token) {
      setShowLoginErrorModal(true);
      return;
    }

    if (!selectedTag) {
      alert("Debes seleccionar al menos un tag para publicar la nota.");
      return;
    }

    const noteData = {
      title: title,
      content: content,
      tags: [selectedTag],
      is_anonymous: isAnonymous,
    };

    try {
      const response = await fetch(`${API_URL}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        alert("¡Nota publicada exitosamente!");
        const modalElement = document.getElementById("exampleModal");
        if (modalElement) {
          const modal = window.bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
        handleClose(); // Reseteamos los inputs
        navigate("/"); // Redirigimos al usuario a la página de inicio
      } else {
        const errorData = await response.json();
        alert(`Error al publicar la nota: ${errorData.msg}`);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("Ocurrió un error inesperado.");
    }
  };

  return (
    <div className="">
      <button
        type="button"
        className="btn btn-primary"
        data-bs-toggle="modal"
        data-bs-target="#exampleModal"
      >
        NEW NOTE!
      </button>

      {/* Modal para crear una nota */}
      <div
        className="modal"
        id="exampleModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                ¿Qué deseas publicar?
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            {/* Definimos si es anonima o no, aun no esta listo, no logro poder mostrar los datos del usuario que publica */}
            <div className="me-3 mt-2 btn-sm d-flex justify-content-end">
              <input
                type="radio"
                className="btn-check"
                name="btnradio"
                id="btnradio1"
                autoComplete="off"
                checked={isAnonymous} // Verificamos el estado
                onChange={() => setIsAnonymous(true)} // Cambia el estado a anónimo
              />
              <label className="btn btn-outline-secondary" htmlFor="btnradio1">Anónimo</label>

              <input
                type="radio"
                className="btn-check"
                name="btnradio"
                id="btnradio2"
                autoComplete="off"
                checked={!isAnonymous} // Verificamos lo opuesto
                onChange={() => setIsAnonymous(false)} // Cambia el estado a público
              />
              <label className="btn btn-outline-secondary" htmlFor="btnradio2">Público</label>
            </div>

            <div className="modal-body">
              <input
                type="text"
                placeholder="Escribe el título de tu nota"
                className="form-control form-control-lg mb-1"
                value={title}
                onChange={handleTitleChange}
              />
              <textarea
                ref={textareaRef}
                className="form-control form-control-lg"
                rows="1"
                placeholder="¿Qué quieres compartir?"
                value={content}
                onChange={handleContentChange}
                style={{ resize: "none", overflow: "hidden" }}
              />

              <p className="mt-3 text-center">AGREGA UN TAG</p>

              <div className="btn-group" role="group" aria-label="Basic checkbox toggle button group">
                <div>
                  {availableTags.map((tag) => (//iteramos sobre los tags disponibles
                    <button
                      key={tag.tag_id}
                      type="button"
                      className={`btn m-1 ${selectedTag === tag.name ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleTagClick(tag.name)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={handleClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={publishNote}
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/*Modal de error para el inicio de sesión */}
      {showLoginErrorModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Error de Autenticación</h5>
                <button type="button" className="btn-close" onClick={() => setShowLoginErrorModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Debes iniciar sesión para poder publicar notas.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLoginErrorModal(false)}>Cerrar</button>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewNote;
