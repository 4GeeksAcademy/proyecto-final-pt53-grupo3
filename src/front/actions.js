const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Debug: verificar la URL del backend
console.log("🔍 Backend URL:", backendUrl);

/**
 * Función para decodificar y verificar el token JWT
 */
const decodeJWT = (token) => {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) {
            throw new Error("Token JWT inválido: no tiene 3 partes");
        }

        const payload = JSON.parse(atob(parts[1]));
        console.log("Token payload:", payload);
        return payload;
    } catch (error) {
        console.error("Error decodificando token:", error);
        return null;
    }
};

export const actions = (dispatch) => ({
    // === LOGIN ===
    login: (email, password) => {
        const opts = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ email, password }),
        };

        const loginUrl = `${backendUrl}/api/token`;
        console.log("🌐 Making login request to:", loginUrl);

        return fetch(loginUrl, opts)
            .then(async (resp) => {
                const responseText = await resp.text();
                console.log("📊 Login response status:", resp.status);
                console.log("📋 Login response text:", responseText);

                if (resp.status === 401) throw new Error("Credenciales inválidas");
                if (resp.status === 422) throw new Error("Datos de formulario inválidos");
                if (resp.status === 400) throw new Error("Solicitud mal formada");
                if (!resp.ok) {
                    throw new Error(`Error en la autenticación: ${resp.status} - ${responseText}`);
                }

                try {
                    return JSON.parse(responseText);
                } catch (e) {
                    throw new Error("Respuesta del servidor no válida");
                }
            })
            .then((data) => {
                if (!data.access_token) throw new Error("Token no recibido del servidor");

                console.log("🔑 Token recibido:", data.access_token);
                const tokenPayload = decodeJWT(data.access_token);
                if (!tokenPayload) throw new Error("Token JWT inválido");

                if (typeof tokenPayload.sub === "number") {
                    tokenPayload.sub = tokenPayload.sub.toString();
                }

                localStorage.setItem("token", data.access_token);
                console.log("💾 Token guardado en localStorage");

                dispatch({ type: "LOGIN_SUCCESS", payload: data.access_token });
                return true;
            })
            .catch((error) => {
                console.error("❌ Error durante el login:", error.message);
                dispatch({ type: "LOGIN_ERROR", payload: error.message });
                return false;
            });
    },

    // === SIGNUP ===
    signup: (userData) => {
        const opts = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(userData),
        };

        const signupUrl = `${backendUrl}/api/user`;
        console.log("🌐 Making signup request to:", signupUrl);

        return fetch(signupUrl, opts)
            .then(async (resp) => {
                const responseText = await resp.text();
                console.log("📊 Signup response status:", resp.status);
                console.log("📋 Signup response text:", responseText);

                if (resp.status === 422) {
                    let errorMessage = "Error de validación en el registro";
                    try {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.detail || errorData.error || errorData.msg || errorMessage;
                    } catch {
                        errorMessage = responseText || errorMessage;
                    }
                    throw new Error(errorMessage);
                }

                if (resp.status === 400) throw new Error("Datos de registro inválidos");
                if (resp.status === 409) throw new Error("El usuario ya existe");
                if (!resp.ok) {
                    throw new Error(`Error en el registro: ${resp.status} - ${responseText}`);
                }

                return JSON.parse(responseText);
            })
            .then(() => {
                console.log("✅ Signup successful, attempting login...");
                return actions(dispatch).login(userData.email, userData.password);
            })
            .catch((error) => {
                console.error("❌ Error durante el registro:", error.message);
                dispatch({ type: "SIGNUP_ERROR", payload: error.message });
                throw error;
            });
    },

    // === LOGIN CON GOOGLE ===
    loginWithGoogle: (googleToken) => {
        return fetch(`${backendUrl}/api/google-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: googleToken })
        })
        .then(async (resp) => {
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Error en login con Google");

            localStorage.setItem("token", data.access_token);
            dispatch({ type: "LOGIN_SUCCESS", payload: data.access_token });

            // Traer info del usuario
            return actions(dispatch).getUser(data.access_token);
        })
        .then(() => true)
        .catch((err) => {
            console.error("❌ Error login Google:", err.message);
            return false;
        });
    },

    // === LOGOUT ===
    logout: () => {
        console.log("🚪 Logging out...");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        console.log("🗑️ Tokens removidos de storage");
        dispatch({ type: "LOGOUT" });
    },

    // === GET USER ===
    getUser: (token) => {
        if (!token) {
            console.error("❌ No token provided for getUser");
            dispatch({ type: "AUTH_ERROR", payload: "Token no proporcionado" });
            return false;
        }

        console.log("🔍 Token para getUser:", token);
        const tokenPayload = decodeJWT(token);
        if (!tokenPayload || !tokenPayload.sub) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            dispatch({ type: "LOGOUT" });
            return false;
        }

        const opts = {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        };

        const profileUrl = `${backendUrl}/api/profile`;
        console.log("🌐 Making profile request to:", profileUrl);

        return fetch(profileUrl, opts)
            .then(async (resp) => {
                const responseText = await resp.text();
                console.log(`📊 Profile response status: ${resp.status}`);
                console.log(`📋 Profile response text: ${responseText}`);

                if (resp.status === 401 || resp.status === 422) {
                    localStorage.removeItem("token");
                    sessionStorage.removeItem("token");
                    dispatch({ type: "LOGOUT" });
                    throw new Error("No autorizado - Sesión expirada");
                }

                if (!resp.ok) {
                    throw new Error(`Error del servidor: ${resp.status} - ${responseText}`);
                }

                const data = JSON.parse(responseText);

                // Si vienen favoritos en el perfil
                if (data.favorites) {
                    dispatch({ type: "SET_FAVORITES", payload: data.favorites });
                }

                return data;
            })
            .then((data) => {
                dispatch({ type: "SET_USER", payload: data });
                return true;
            })
            .catch((error) => {
                console.error("❌ Error fetching user data:", error.message);
                dispatch({ type: "PROFILE_ERROR", payload: error.message });
                return false;
            });
    },

    // === VERIFY TOKEN ===
    verifyToken: (token) => {
        console.log("🔍 Verifying token...");
        return actions(dispatch).getUser(token);
    },

    // ===============================
    // FAVORITOS CON BACKEND
    // ===============================

    getFavorites: () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        return fetch(`${backendUrl}/api/favorites`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then((resp) => resp.json())
            .then((data) => {
                dispatch({ type: "SET_FAVORITES", payload: data });
                console.log("✅ Favoritos cargados:", data);
            })
            .catch((error) => {
                console.error("❌ Error obteniendo favoritos:", error);
            });
    },

    addFavorite: (noteId) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        return fetch(`${backendUrl}/api/favorites/${noteId}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(async (resp) => {
                const response = await resp.json();
                if (!resp.ok) throw new Error(response.msg || "Error al agregar favorito");

                dispatch({ type: "ADD_FAVORITE", payload: { note_id: noteId } });
                console.log("✅ Nota agregada a favoritos:", response);
                return response;
            })
            .catch((error) => {
                console.error("❌ Error agregando favorito:", error.message);
                throw error;
            });
    },

    removeFavorite: (noteId) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        return fetch(`${backendUrl}/api/favorites/${noteId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(async (resp) => {
                const response = await resp.json();
                if (!resp.ok) throw new Error(response.msg || "Error al eliminar favorito");

                dispatch({ type: "REMOVE_FAVORITE", payload: noteId });
                console.log("✅ Nota removida de favoritos:", response);
                return response;
            })
            .catch((error) => {
                console.error("❌ Error eliminando favorito:", error.message);
                throw error;
            });
    },

    setFavorites: (favorites) => {
        dispatch({ type: "SET_FAVORITES", payload: favorites });
    },
});
