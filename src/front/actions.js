const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const actions = (dispatch) => ({

    login: (email, password) => {
        const opts = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        };

        return fetch(`${backendUrl}api/token`, opts)
            .then(resp => {
                if (resp.status === 401) throw new Error("Credenciales inválidas");
                if (!resp.ok) throw new Error("Error en la autenticación");
                return resp.json();
            })
            .then(data => {
                sessionStorage.setItem("token", data.access_token);
                dispatch({ type: 'LOGIN_SUCCESS', payload: data.access_token });
                return true;
            })
            .catch(error => {
                console.error("Error durante el login fetch:", error);
                return false;
            });
    },

    signup: (userData) => {
        const opts = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        };

        return fetch(`${backendUrl}api/user`, opts)
            .then(resp => {
                if (!resp.ok) {
                    return resp.json().then(errorData => {
                        throw new Error(errorData.error || "Error en el registro");
                    });
                }
                return resp.json();
            })
            .then(data => {
                return actions(dispatch).login(userData.email, userData.password);
            })
            .catch(error => {
                console.error("Error durante el registro:", error.message);
                throw error;
            });
    },

    /**
     * Cierra la sesión del usuario, eliminando el token.
     */
    logout: () => {
        sessionStorage.removeItem("token");
        dispatch({ type: 'LOGOUT' });
    },

    /**
     * Obtener los datos del perfil del usuario autenticado.
     */
    getUser: (token) => {
        const opts = {
            headers: {
                Authorization: "Bearer " + token,
            },
        };

        return fetch(`${backendUrl}api/profile`, opts)
            .then(resp => {
                if (!resp.ok) {
                    throw new Error("No se pudieron obtener los datos del usuario");
                }
                return resp.json();
            })
            .then(data => {
                dispatch({ type: 'SET_USER', payload: data });
                return true;
            })
            .catch(error => {
                console.error("Error fetching user data:", error);
                return false;
            });
    }
});