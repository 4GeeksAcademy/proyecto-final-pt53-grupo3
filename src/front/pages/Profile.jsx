import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
  const [userNotes, setUserNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const navigate = useNavigate();

  // Function to properly close modal and reset page state
  const closeModal = () => {
    const modal = document.getElementById("profile-picture-pfp");
    
    // Try multiple methods to close the modal
    if (window.bootstrap && window.bootstrap.Modal) {
      const bootstrapModal = window.bootstrap.Modal.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
    }
    
    // Force close modal using jQuery if available
    if (window.$ && window.$.fn.modal) {
      window.$('#profile-picture-pfp').modal('hide');
    }
    
    // Manual cleanup - remove all modal-related classes and elements
    setTimeout(() => {
      // Remove modal backdrop
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      
      // Reset body classes and styles
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      // Hide modal manually
      if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');
      }
      
      // Reset file input
      const fileInput = document.querySelector('#profile-picture-pfp input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    }, 100);
  };

  // Debug: Verificar todas las variables de entorno
  console.log("🔍 Environment variables:", {
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
    VITE_BASENAME: import.meta.env.VITE_BASENAME,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
  });

  // Debug: Verificar todo el localStorage
  console.log("🔍 LocalStorage completo:", {
    token: localStorage.getItem("token"),
    allItems: { ...localStorage },
  });

  // Verificar token al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🔑 Token encontrado en useEffect:", token);

    if (!token) {
      console.error("❌ NO HAY TOKEN - Redirigiendo a login");
      navigate("/login");
      return;
    }

    console.log("✅ Token válido encontrado, cargando datos...");
    // Si hay token, cargar los datos
    fetchUserProfile();
    fetchUserNotes();
  }, [navigate]);

  // Obtener perfil del usuario
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔑 Token en fetchUserProfile:", token);

      if (!token) {
        console.error("❌ No token found in fetchUserProfile");
        return;
      }

      // URL CORRECTA - sin doble slash
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const url = `${backendUrl}/api/profile`.replace(/([^:]\/)\/+/g, "$1");

      console.log("🌐 Fetching profile from:", url);
      console.log("📋 Headers:", {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📊 Profile response status:", response.status);
      console.log(
        "📊 Profile response headers:",
        Object.fromEntries([...response.headers])
      );

      if (response.ok) {
        const profile = await response.json();
        console.log("✅ User profile data:", profile);
        setUserProfile(profile);
        setBio(profile.bio || "");
      } else {
        console.error("❌ Error fetching profile:", response.status);
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);

        if (response.status === 401 || response.status === 422) {
          console.log("🗑️ Removing invalid token and redirecting to login");
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    } catch (error) {
      console.error("❌ Network error fetching user profile:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    console.log("Selected file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found, cannot upload file.");

      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const url = `${backendUrl}api/profile/upload-picture`;

      console.log("Upload details:", {
        backendUrl,
        finalUrl: url,
        fileSize: file.size,
        fileType: file.type,
        hasToken: !!token,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Fetch response received:", response);

      console.log("📊 Response status:", response.status);
      console.log(
        "📊 Response headers:",
        Object.fromEntries([...response.headers])
      );

      if (response.ok) {
        const data = await response.json();
        console.log("File uploaded successfully:", data);
        
        // Close modal properly
        closeModal();
        
        // Refresh profile data to show new image
        await fetchUserProfile();
        
        // Show success message

      } else {
        const errorText = await response.text();
        console.error("Error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        let errorMessage = "Unknown error";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage =
            errorJson.error || errorJson.message || "Unknown error";
        } catch {
          errorMessage = errorText || `HTTP ${response.status}`;
        }

        alert(`Error uploading file: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Network error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      alert(`Network error: ${error.message}. Check console for details.`);
    }
  };

  const handleRemoveProfilePicture = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No authentication token found. Please log in again.");
      return;
    }

    if (!confirm("¿Estás seguro de que quieres eliminar tu foto de perfil?")) {
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const url = `${backendUrl}/api/profile/remove-picture`.replace(/([^:]\/)\/+/g, "$1");

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Close modal properly
        closeModal();

        await fetchUserProfile();
      } else {
        const errorText = await response.text();
        console.error("Error removing profile picture:", errorText);
      }
    } catch (error) {
      console.error("Error removing profile picture:", error);

    }
  };

  // Actualizar bio del usuario
  const updateBio = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔑 Token en updateBio:", token);

      if (!token) {
        console.error("No token found");
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const url = `${backendUrl}/api/profile/bio`.replace(/([^:]\/)\/+/g, "$1");

      console.log("🌐 Updating bio at:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio: bio }),
      });

      console.log("📊 Bio update response status:", response.status);

      if (response.ok) {
        console.log("✅ Bio updated successfully");
        setIsEditingBio(false);
        setUserProfile((prev) => ({ ...prev, bio: bio }));
      } else {
        console.error("Error updating bio:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating bio:", error);
    }
  };

  // Obtener notas del usuario
  const fetchUserNotes = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔑 Token en fetchUserNotes:", token);

      if (!token) {
        console.error("❌ No token found in fetchUserNotes");
        return;
      }

      // URL CORRECTA para las notas del usuario
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const url = `${backendUrl}/api/profile/notes`.replace(
        /([^:]\/)\/+/g,
        "$1"
      );

      console.log("🌐 Fetching user notes from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📊 Notes response status:", response.status);

      if (response.ok) {
        const notes = await response.json();
        console.log("✅ User notes data:", notes);
        setUserNotes(notes);
      } else {
        console.error("❌ Error fetching notes:", response.status);
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
      }
    } catch (error) {
      console.error("❌ Network error fetching user notes:", error);
    } finally {
      console.log("🏁 Loading complete");
      setLoading(false);
    }
  };

  // Debug: Estado actual del componente
  console.log("📊 Component state:", {
    loading,
    userProfile,
    userNotes: userNotes.length,
    bio,
    isEditingBio,
  });

  // Debug: Profile picture URL
  console.log("🖼️ Profile picture debug:", {
    hasUserProfile: !!userProfile,
    profilePictureUrl: userProfile?.profile_picture_url,
    backendUrl: import.meta.env.VITE_BACKEND_URL,
    fullImageUrl: userProfile?.profile_picture_url
      ? `${import.meta.env.VITE_BACKEND_URL}${userProfile.profile_picture_url}`
      : null,
  });

  if (loading && !userProfile) {
    console.log("🌀 Showing loading spinner");
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <div className="ms-3">Cargando perfil...</div>
      </div>
    );
  }

  console.log("🎨 Rendering profile UI");
  return (
    <>
      <link
        href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css"
        rel="stylesheet"
      />
      <div
        style={{
          backgroundColor: "#ffffff",
          minHeight: "100vh",
          paddingTop: "20px",
          paddingBottom: "40px",
        }}
      >
        <section id="content" className="container">
          <div className="page-heading">
            <div className="media clearfix">
              <div className="media-left pr30"></div>
              <div className="media-body va-m">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div
                      className="profile-picture-upload"
                      data-bs-toggle="modal"
                      data-bs-target="#profile-picture-pfp"
                    >
                      <div
                        className="profile-picture-container mt-3"
                        style={{
                          width: "150px",
                          height: "150px",
                          border: "2px dashed #ccc",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f8f9fa",
                          cursor: "pointer",
                          position: "relative",
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {userProfile?.profile_picture_url ? (
                          <img
                            src={`${import.meta.env.VITE_BACKEND_URL}${
                              userProfile.profile_picture_url
                            }`.replace(/([^:]\/)\/+/g, "$1")}
                            alt="Profile"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: "center",
                              borderRadius: "6px",
                              border: "none",
                              display: "block",
                            }}
                            onLoad={() =>
                              console.log(
                                "✅ Profile image loaded successfully"
                              )
                            }
                            onError={(e) => {
                              console.error(
                                "❌ Profile image failed to load:",
                                {
                                  src: e.target.src,
                                  error: e.type,
                                  userProfile: userProfile,
                                }
                              );
                            }}
                          />
                        ) : (
                          <div className="text-center">
                            <i className="fa fa-camera fa-2x text-muted mb-2"></i>
                            <br />
                            <i className="text-muted mb-2 " >Click para editar</i>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <h4 className="mb-1">
                        {userProfile
                          ? userProfile.username
                          : "Usuario no encontrado"}
                      </h4>
                      <p className="text-muted">
                        {userProfile
                          ? `${userProfile.first_name} ${userProfile.last_name}`
                          : "Perfil no disponible"}
                      </p>
                    </div>
                  </div>

                  {/* Modal de la foto de perfil */}
                  <div
                    className="modal fade"
                    id="profile-picture-pfp"
                    tabIndex="-1"
                    aria-labelledby="profilePictureModalLabel"
                    aria-hidden="true"
                  >
                    <div className="modal-dialog">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5
                            className="modal-title"
                            id="profilePictureModalLabel"
                          >
                            Foto de perfil
                          </h5>
                          <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                          ></button>
                        </div>
                        <div
                          className="modal-body d-flex flex-column align-items-center justify-content-center"
                          style={{
                            minHeight: "200px",
                            position: "relative",
                            cursor: "pointer",
                          }}
                        >
                          <i className="fa fa-camera fa-2x text-muted mb-2"></i>
                          <p className="text-muted small mb-0">
                            Sube tu foto de perfil
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              opacity: 0,
                              cursor: "pointer",
                            }}
                          />
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            data-bs-dismiss="modal"
                          >
                            Cancelar
                          </button>
                          {userProfile?.profile_picture_url ? (
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={handleRemoveProfilePicture}
                            >
                              Eliminar foto
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                const fileInput = document.querySelector(
                                  '#profile-picture-pfp input[type="file"]'
                                );
                                if (fileInput) {
                                  fileInput.click();
                                }
                              }}
                            >
                              Seleccionar Imagen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-9">
                    <div className="bio-section">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5>Biografía</h5>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            if (isEditingBio) {
                              updateBio();
                            } else {
                              setIsEditingBio(true);
                            }
                          }}
                        >
                          {isEditingBio ? "Guardar" : "Editar"}
                        </button>
                      </div>
                      <textarea
                        id="profileDescription"
                        className="form-control"
                        rows="6"
                        placeholder="Un poco sobre mi!"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        readOnly={!isEditingBio}
                        style={{
                          resize: "vertical",
                          minHeight: "140px",
                          borderColor: "#dee2e6",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                          backgroundColor: isEditingBio ? "#fff" : "#f8f9fa",
                          cursor: isEditingBio ? "text" : "default",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Notas del usuario */}
                <div className="row mt-5">
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h3>Mis Notas</h3>
                      <span className="badge bg-secondary">
                        {userNotes.length}{" "}
                        {userNotes.length === 1 ? "nota" : "notas"}
                      </span>
                    </div>
                  </div>

                  {loading ? (
                    <div className="col-12 text-center">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">
                          Cargando notas...
                        </span>
                      </div>
                      <p className="mt-2">Cargando notas...</p>
                    </div>
                  ) : userNotes.length === 0 ? (
                    <div className="col-12 text-center py-5">
                      <div className="mb-4">
                        <i className="fas fa-sticky-note fa-4x text-muted"></i>
                      </div>
                      <h4 className="text-muted">No tienes notas todavía</h4>
                      <p className="text-muted">
                        ¡Crea tu primera nota y compártela con la comunidad!
                      </p>
                      <Link to="/" className="btn btn-primary">
                        Crear primera nota
                      </Link>
                    </div>
                  ) : (
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                      {userNotes.map((note) => (
                        <div key={note.note_id} className="col">
                          <div className="card h-100 shadow-sm d-flex flex-column"style={{
                              width: "100%",
                              maxWidth: "24rem",
                              transition: "transform 0.2s, box-shadow 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-5px)";
                              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
                            }}>
                            <div className="card-body d-flex flex-column">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h5
                                  className="card-title text-truncate"
                                  title={note.title}
                                >
                                  {note.title || "Sin título"}
                                </h5>
                                {note.is_anonymous && (
                                  <span className="badge bg-info ms-2">
                                    Anónimo
                                  </span>
                                )}
                              </div>

                              <p className="card-text text-muted">
                                {note.content && note.content.length > 150
                                  ? `${note.content.substring(0, 150)}...`
                                  : note.content || "Sin contenido"}
                              </p>

                              {note.tags && note.tags.length > 0 && (
                                <div className="mb-3">
                                  <div className="d-flex flex-wrap gap-1">
                                    {note.tags.map((tag, index) => (
                                      <span
                                        key={index}
                                        className="badge bg-primary"
                                        style={{ fontSize: "0.75rem" }}
                                      >
                                        {typeof tag === "object"
                                          ? tag.name
                                          : tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-auto">
                                <small className="text-muted">
                                  <i className="fas fa-clock me-1"></i>
                                  {note.created_at
                                    ? new Date(
                                        note.created_at
                                      ).toLocaleDateString("es-ES", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Fecha no disponible"}
                                </small>
                              </div>
                            </div>

                            {/* Footer con botones de acción */}
                            <div className="card-footer bg-transparent border-top-0">
                              <div className="d-flex justify-content-between align-items-center">
                                <Link
                                  to={`/noteDetail/${note.note_id}`}
                                  className="btn btn-outline-primary btn-sm"
                                >
                                  Leer más
                                </Link>

                                <div className="d-flex gap-2 align-items-center">
                                  {/* Contador de votos positivos */}
                                  <small className="text-muted">
                                    <i className="fas fa-thumbs-up me-1 text-success"></i>
                                    {note.positive_votes || 0}
                                  </small>

                                  {/* Contador de votos negativos */}
                                  <small className="text-muted">
                                    <i className="fas fa-thumbs-down me-1 text-danger"></i>
                                    {note.negative_votes || 0}
                                  </small>

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
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Profile;
