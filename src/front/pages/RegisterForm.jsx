import { Link } from "react-router-dom";
import React from 'react';
import logo from "/workspaces/proyecto-final-pt53-grupo3/src/front/assets/img/logo1.png";
import { useState, useEffect } from "react";
import { BackendURL } from "../components/BackendURL";
import { useNavigate } from "react-router-dom";


const RegisterForm = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: ""
  })
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { value, name } = event.target

    setUser({
      ...user,
      [name]: value
    })
  }

  const handleUserSubmit = (event) => {
    event.preventDefault();

    if (user.password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (user.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setError("");

    fetch(`${backendUrl}api/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(user)
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || "Ocurrió un error desconocido");
          });
        }
        return response.json();
      }).then(() => {
        alert("Creaste tu usuario exitosamente");
        navigate("/");
      })
      .catch(error => {
        console.log("Error en el fetch:", error.message);
        setError(error.message);
      });
  };


  console.log(user)

  return (
    <>

      <div className="container-fluid">

        <div className="row vh-100 d-flex align-items-center">
          <div className="col-md-4 col-lg-4 d-none d-md-block h-100 sidebar-custom-color"></div>
          <div className="col-12 col-md-4 col-lg-4">
            <form className="register-form p-2 p-md-2" onSubmit={handleUserSubmit}>

              <div className="form-logo d-flex flex-column align-items-center">
                <img
                  src={logo}
                  alt="Noted Logo"
                  className="rounded"
                  style={{ width: "170px", height: "120px", objectFit: "contain" }}
                />
              </div>
              <h5 className="mb-2 fw-normal text-center">Formulario de Registro</h5>

              <div className="form-floating mb-3">
                <input onChange={handleChange} name="first_name"
                  type="text"
                  className="form-control"
                  id="floatingFirtsName"
                  placeholder="name"
                  required
                />
                <label htmlFor="floatingFirstName">Nombre</label>
              </div>
              <div className="form-floating mb-3">
                <input onChange={handleChange} name="last_name"
                  type="text"
                  className="form-control"
                  id="floatingLastName"
                  placeholder="lastName"
                  required
                />
                <label htmlFor="floatingUser">Apellido</label>
              </div>

              <div className="form-floating mb-3">
                <input onChange={handleChange} name="username"
                  type="text"
                  className="form-control"
                  id="floatingUsername"
                  placeholder="username"
                  required
                />
                <label htmlFor="floatingUsername">Nombre de Usuario (alias)</label>
                <small className="form-text text-muted ms-1">
                  *Máximo 12 caracteres.</small>
              </div>

              <div className="form-floating mb-3">
                <input onChange={handleChange} name="email"
                  type="email"
                  className="form-control"
                  id="floatingEmail"
                  placeholder="name@example.com"
                  required
                />
                <label htmlFor="floatingEmail">Correo electrónico</label>
              </div>

              <div className="form-floating mb-3">
                <input onChange={handleChange} name="password"
                  type="password"
                  className="form-control"
                  id="floatingPassword"
                  placeholder="Password"
                  required
                />
                <label htmlFor="floatingPassword">Contraseña</label>
                {error && <small className="text-danger ms-1">{error}</small>}
                <small className="form-text text-muted ms-1">
                  *Minimo 8 caracteres.</small>
              </div>
              <div className="form-floating mb-3">
                <input
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  name="confirmPassword"
                  type="password"
                  className="form-control"
                  id="floatingConfirmPassword"
                  placeholder="Confirm Password"
                  required
                />
                <label htmlFor="floatingConfirmPassword">Confirmar Contraseña</label>
              </div>
              {error && <div className="alert alert-danger mt-3">{error}</div>}

              <button className="w-100 btn btn-lg btn-dark mt-3" type="submit">
                Registrarme
              </button>

              <p className="mt-5 mb-3 text-muted text-center">© 2025</p>
            </form>
          </div>

          <div className="col-md-4 col-lg-4 d-none d-md-block h-100 sidebar-custom-color"></div>
        </div>
      </div>
    </>
  );
};

export default RegisterForm;