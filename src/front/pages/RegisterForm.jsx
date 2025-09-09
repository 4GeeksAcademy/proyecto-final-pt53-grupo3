import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from '../hooks/useGlobalReducer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { GoogleLogin } from '@react-oauth/google';
import '../styles/auth.css';

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

  const handleUserSubmit = async (event) => {
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

    try {
      const signupSuccess = await actions.signup(user);
      if (signupSuccess) {
        const token = localStorage.getItem("token");
        await actions.getUser(token);
        alert("¡Usuario creado e inicio de sesión exitoso!");
        navigate("/profile");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const googleToken = credentialResponse.credential;
      const success = await actions.loginWithGoogle(googleToken);
      if (success) {
        alert("¡Registro con Google exitoso!");
        navigate("/profile");
      } else {
        setError("Error iniciando sesión con Google");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="container-fluid auth-wrapper">
      <div className="auth-card p-4 p-sm-5">
        <h5 className="auth-title mb-1">Crea tu cuenta</h5>
        <p className="auth-subtle text-center mb-4">Regístrate para continuar</p>

        <form onSubmit={handleUserSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-floating mb-3">
            <input onChange={handleChange} name="first_name" type="text" className="form-control auth-input" placeholder="Nombre" required />
            <label>Nombre</label>
          </div>
          <div className="form-floating mb-3">
            <input onChange={handleChange} name="last_name" type="text" className="form-control auth-input" placeholder="Apellido" required />
            <label>Apellido</label>
          </div>
          <div className="form-floating mb-3">
            <input onChange={handleChange} name="username" type="text" className="form-control auth-input" placeholder="Nombre de usuario" required />
            <label>Nombre de Usuario</label>
          </div>
          <div className="form-floating mb-3">
            <input onChange={handleChange} name="email" type="email" className="form-control auth-input" placeholder="Correo electrónico" required />
            <label>Correo electrónico</label>
          </div>

          <div className="form-floating mb-3 position-relative">
            <input onChange={handleChange} name="password" type={showPassword ? "text" : "password"} className="form-control auth-input" placeholder="Contraseña" required />
            <label>Contraseña</label>
            <span className="auth-toggle-visibility text-secondary" onClick={() => setShowPassword(!showPassword)}>
              <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
            </span>
          </div>

          <div className="form-floating mb-3 position-relative">
            <input onChange={(e) => setConfirmPassword(e.target.value)} name="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="form-control auth-input" placeholder="Confirmar Contraseña" required />
            <label>Confirmar Contraseña</label>
            <span className="auth-toggle-visibility text-secondary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} />
            </span>
          </div>

          <button className="btn btn-lg auth-primary-btn mt-2" type="submit">Registrarme</button>

          <div className="auth-divider"><span>o continúa con</span></div>

          <div className="auth-google">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setError("Error iniciando sesión con Google")}
            />
          </div>

          <p className="auth-footer mt-4">
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
