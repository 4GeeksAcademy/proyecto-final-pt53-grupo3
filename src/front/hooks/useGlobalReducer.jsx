import { useContext, useReducer, createContext } from "react";
import storeReducer, { initialStore } from "../store";
import { actions } from "../actions";  // 1. Importa las acciones

const StoreContext = createContext();

export function StoreProvider({ children }) {
    const [store, dispatch] = useReducer(storeReducer, initialStore());
    
    
    const appActions = actions(dispatch);

    
    return (
        <StoreContext.Provider value={{ store, actions: appActions }}>
            {children}
        </StoreContext.Provider>
    );
}

export default function useGlobalReducer() {
    const { store, actions } = useContext(StoreContext);
    return { store, actions };
}