import React, { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import useGlobalReducer from '../hooks/useGlobalReducer';
import logo from "/workspaces/proyecto-final-pt53-grupo3/src/front/assets/img/logo1.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const LoginForm = () => {
    const { actions } = useGlobalReducer();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (event) => {
        event.preventDefault();

        if (!email || !password) {
            setError("El correo y la contraseña son obligatorios");
            return;
        }

        actions.login(email, password)
            .then(loggedIn => {
                if (loggedIn) {
                    // Si el login es exitoso, obtenemos los datos del usuario
                    actions.getUser(sessionStorage.getItem("token"))
                        .then(userFetched => {
                            if (userFetched) {
                                alert("¡Inicio de sesión exitoso!");
                                navigate("/profile");
                            }
                        });
                } else {
                    setError("Email o Contraseña inválida");
                }
            });
    };

    return (
        <div className="container-fluid">
            <div className="row vh-100 d-flex align-items-center">
                
                <div className="col-md-4 col-lg-4 d-none d-md-block h-100 sidebar-custom-color"></div>

                
                <div className="col-12 col-md-4 col-lg-4">
                    <form onSubmit={handleLogin} className="p-4">
                        <div className="form-logo d-flex flex-column align-items-center mb-4">
                            <img
                                src={logo}
                                alt="Logo"
                                className="rounded"
                                style={{ width: "170px", height: "120px", objectFit: "contain" }}
                            />
                        </div>
                        <h2 className="text-center mb-4">Iniciar Sesión</h2>
                        {error && <div className="alert alert-danger">{error}</div>}
                        <div className="form-floating mb-3">
                            <input
                                type="email"
                                className="form-control"
                                id="floatingEmail"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <label htmlFor="floatingEmail">Correo electrónico</label>
                        </div>
                        <div className="form-floating mb-3 position-relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                id="floatingPassword"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <label htmlFor="floatingPassword">Contraseña</label>
                            <span
                                className="position-absolute end-0 top-50 translate-middle-y me-3 text-secondary"
                                style={{ cursor: 'pointer', zIndex: '100' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                            </span>
                        </div>
                        <button className="w-100 btn btn-lg btn-dark mt-3" type="submit">
                            Entrar
                        </button>
                        <p className="mt-4 text-center">
                            ¿No tienes una cuenta? <Link to="/RegisterForm">Regístrate aquí</Link>
                        </p>
                    </form>
                </div>

                
                <div className="col-md-4 col-lg-4 d-none d-md-block h-100 sidebar-custom-color"></div>
            </div>
        </div>
    );
};

export default LoginForm;