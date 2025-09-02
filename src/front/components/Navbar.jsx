import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer"; // 1. Importa tu hook
import NewNote from "./NewNote";

export const Navbar = () => {
    //  hook para acceder al store y a las acciones
    const { store, actions } = useGlobalReducer();
    const navigate = useNavigate();

    // función para manejar el logout
    const handleLogout = () => {
        actions.logout();
        navigate("/"); // Redirige al inicio después de cerrar sesión
    };

    return (
        <header className="bg-light border-bottom">
            <div className="container py-3">
                <nav className="d-flex align-items-center justify-content-between">
                    <Link to="/" className="text-decoration-none text-dark">
                        <h1 className="m-0">Logo</h1>
                    </Link>
                    <div className="d-flex align-items-center gap-3">
                        {store.token ? (
                            <>
                                <span className="fw-bold">
                                    Hola, {store.user ? store.user.username : '...'}
                                </span>
                                <Link to="/profile" className="btn btn-primary">
                                    Perfil
                                </Link>
                                <NewNote />
                                <button onClick={handleLogout} className="btn btn-danger">
                                    Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            // Si NO HAY token (usuario no logueado)
                            <>
                                <Link to="/about" className="nav-link text-secondary">
                                    Sobre nosotros
                                </Link>
                                <Link to="/login" className="nav-link text-secondary">
                                    Iniciar Sesión
                                </Link>
                                <Link to="/RegisterForm">
                                    <button className="btn btn-dark">Registrarse</button>
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
};