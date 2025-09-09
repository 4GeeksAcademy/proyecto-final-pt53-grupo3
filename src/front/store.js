// 1. ESTADO INICIAL COMBINADO
export const initialStore = () => {
  return {
    message: null,
    todos: [
      { id: 1, title: "Make the bed", background: null },
      { id: 2, title: "Do my homework", background: null },
    ],
    // ojo, Nuevo para el perfil
    token: localStorage.getItem("token") || null,
    user: null,

    // === FAVORITOS ===
    favorites: [], // Agregado para almacenar favoritos
  };
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "set_hello":
      return {
        ...store,
        message: action.payload,
      };
    case "add_task":
      const { id, color } = action.payload;
      return {
        ...store,
        todos: store.todos.map((todo) =>
          todo.id === id ? { ...todo, background: color } : todo
        ),
      };

    // OJO --- NUEVAS ACCIONES PARA AUTENTICACIÓN ---
    case "LOGIN_SUCCESS":
      return {
        ...store,
        token: action.payload,
      };
    case "SET_USER":
      return {
        ...store,
        user: action.payload,
      };
    case "LOGOUT":
      return {
        ...store,
        token: null,
        user: null,
        favorites: [], // Limpiar favoritos al hacer logout
      };

    // === ACCIONES PARA FAVORITOS ===
    case "ADD_FAVORITE": // Agrega un favorito
      return {
        ...store,
        favorites: [...store.favorites, action.payload],
      };
    case "REMOVE_FAVORITE": // Remueve un favorito por id
      return {
        ...store,
        // CORRECCIÓN: debe ser note_id para que coincida con tu objeto de nota
        favorites: store.favorites.filter(
          (fav) => (fav.note_id || fav.id) !== action.payload
        ),
      };
    case "SET_FAVORITES": // Establece lista completa de favoritos (útil para inicializar)
      return {
        ...store,
        favorites: action.payload,
      };

    default:
      return store;
  }
}
