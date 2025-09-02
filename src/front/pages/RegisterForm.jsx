import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from '../hooks/useGlobalReducer';
import logo from "/workspaces/proyecto-final-pt53-grupo3/src/front/assets/img/logo1.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const RegisterForm = () => {
    const { actions } = useGlobalReducer();
    const navigate = useNavigate();

    const [user, setUser] = useState({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: ""
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (event) => {
        setUser({ ...user, [event.target.name]: event.target.value });
    };

    const handleUserSubmit = (event) => {
        event.preventDefault();
        setError(""); 

        if (user.password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }
        if (user.password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        
        actions.signup(user)
            .then(signupSuccess => {
                if (signupSuccess) {
                    actions.getUser(sessionStorage.getItem("token"));
                    alert("¡Usuario creado e sesión iniciada exitosamente!");
                    navigate("/profile");
                }
            })
            .catch(err => {
                setError(err.message);
            });
    };

    return (
        <div className="container-fluid">
            <div className="row vh-100 d-flex align-items-center">
                <div className="col-md-4 col-lg-4 d-none d-md-block h-100 sidebar-custom-color"></div>
                <div className="col-12 col-md-4 col-lg-4">
                    <form className="p-4" onSubmit={handleUserSubmit}>
                        <div className="form-logo d-flex flex-column align-items-center mb-4">
                            <img src={logo} alt="Logo" className="rounded" style={{ width: "170px", height: "120px", objectFit: "contain" }}/>
                        </div>
                        <h5 className="mb-3 fw-normal text-center">Formulario de Registro</h5>
                        {error && <div className="alert alert-danger">{error}</div>}
                        
                      
                        <div className="form-floating mb-3">
                            <input onChange={handleChange} name="first_name" type="text" className="form-control" id="floatingFirstName" placeholder="Nombre" required />
                            <label htmlFor="floatingFirstName">Nombre</label>
                        </div>
                        <div className="form-floating mb-3">
                            <input onChange={handleChange} name="last_name" type="text" className="form-control" id="floatingLastName" placeholder="Apellido" required />
                            <label htmlFor="floatingLastName">Apellido</label>
                        </div>
                        <div className="form-floating mb-3">
                            <input onChange={handleChange} name="username" type="text" className="form-control" id="floatingUsername" placeholder="Nombre de usuario" required />
                            <label htmlFor="floatingUsername">Nombre de Usuario</label>
                        </div>
                        <div className="form-floating mb-3">
                            <input onChange={handleChange} name="email" type="email" className="form-control" id="floatingEmail" placeholder="name@example.com" required />
                            <label htmlFor="floatingEmail">Correo electrónico</label>
                        </div>

                        
                        <div className="form-floating mb-3 position-relative">
                            <input onChange={handleChange} name="password" type={showPassword ? "text" : "password"} className="form-control" id="floatingPassword" placeholder="Contraseña" required />
                            <label htmlFor="floatingPassword">Contraseña</label>
                            <span className="position-absolute end-0 top-50 translate-middle-y me-3 text-secondary" style={{ cursor: 'pointer', zIndex: '100' }} onClick={() => setShowPassword(!showPassword)}>
                                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                            </span>
                        </div>

                        
                        <div className="form-floating mb-3 position-relative">
                            <input onChange={(e) => setConfirmPassword(e.target.value)} name="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="form-control" id="floatingConfirmPassword" placeholder="Confirmar Contraseña" required />
                            <label htmlFor="floatingConfirmPassword">Confirmar Contraseña</label>
                            <span className="position-absolute end-0 top-50 translate-middle-y me-3 text-secondary" style={{ cursor: 'pointer', zIndex: '100' }} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} />
                            </span>
                        </div>
                        
                        <button className="w-100 btn btn-lg btn-dark mt-3" type="submit">Registrarme</button>
                        <p className="mt-4 text-center">
                            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
                        </p>
                    </form>
                </div>
                <div className="col-md-4 col-lg-4 d-none d-md-block h-100 sidebar-custom-color"></div>
            </div>
        </div>
    );
};

export default RegisterForm;