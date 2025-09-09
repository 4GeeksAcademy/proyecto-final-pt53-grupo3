import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import NewNote from "./NewNote";
import { Dropdown } from 'react-bootstrap';

export const Navbar = () => {
    const { store, actions } = useGlobalReducer();
    const navigate = useNavigate();

    const handleLogout = () => {
        actions.logout();
        navigate("/");
    };

    return (
        <header className="navbar-custom">
            <div className="container d-flex align-items-center justify-content-between py-3">
                
                {/* Logo */}
                <Link to="/" className="navbar-logo text-decoration-none">
                    <h2 className="m-0">MyApp</h2>
                </Link>

                {/* Menu */}
                <div className="d-flex align-items-center gap-3 flex-wrap">
                    {store.token ? (
                        <>
                            <span className="username me-2">Hola {store.user ? store.user.username : '...'}</span>

                            <Dropdown>
                                <Dropdown.Toggle className="btn btn-outline-primary btn-sm" id="favoritesDropdown">
                                    Favoritos ({store.favorites.length})
                                </Dropdown.Toggle>
                                <Dropdown.Menu style={{ maxHeight: "300px", overflowY: "auto" }}>
                                    {store.favorites.length === 0 && (
                                        <Dropdown.ItemText className="text-muted">No tienes favoritos</Dropdown.ItemText>
                                    )}
                                    {store.favorites.map(note => (
                                        <Dropdown.Item as={Link} to={`/noteDetail/${note.note_id}`} key={note.note_id}>
                                            {note.title || "Sin título"}
                                        </Dropdown.Item>
                                    ))}
                                    <Dropdown.Divider />
                                    <Dropdown.Item as={Link} to="/favorites" className="text-warning fw-bold">
                                        Ver todos mis favoritos ⭐
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>

                            <Link to="/profile" className="btn btn-outline-dark btn-sm">Perfil</Link>
                            <NewNote />
                            <button onClick={handleLogout} className="btn btn-danger btn-sm">
                                Cerrar Sesión
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/about" className="nav-link text-secondary">Sobre nosotros</Link>
                            <Link to="/login" className="btn btn-outline-primary btn-sm">Iniciar Sesión</Link>
                            <Link to="/RegisterForm" className="btn btn-primary btn-sm">Registrarse</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
