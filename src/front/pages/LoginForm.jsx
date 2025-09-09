import React, { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import useGlobalReducer from '../hooks/useGlobalReducer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { GoogleLogin } from '@react-oauth/google';
import '../styles/auth.css';

const LoginForm = () => {
  const { actions } = useGlobalReducer();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError("El correo y la contraseña son obligatorios");
      return;
    }

    try {
      const loggedIn = await actions.login(email, password);
      if (loggedIn) {
        alert("¡Inicio de sesión exitoso!");
        const token = localStorage.getItem("token");
        await actions.getUser(token);
        navigate("/profile");
      } else {
        setError("Email o Contraseña inválida");
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
        alert("¡Inicio de sesión con Google exitoso!");
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
        <h3 className="auth-title mb-1">Bienvenido de nuevo</h3>
        <p className="auth-subtle text-center mb-4">Ingresa para continuar</p>

        <form onSubmit={handleLogin}>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-floating mb-3">
            <input
              type="email"
              className="form-control auth-input"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Correo electrónico</label>
          </div>

          <div className="form-floating mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control auth-input"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Contraseña</label>
            <span
              className="auth-toggle-visibility text-secondary"
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
            </span>
          </div>

          <button className="btn btn-lg auth-primary-btn mt-2" type="submit">
            Entrar
          </button>

          <div className="auth-divider"><span>o continúa con</span></div>

          <div className="auth-google">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setError("Error iniciando sesión con Google")}
            />
          </div>

          <p className="auth-footer mt-4">
            ¿No tienes una cuenta? <Link to="/RegisterForm">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
