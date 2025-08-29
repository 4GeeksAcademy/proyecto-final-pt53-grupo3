import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <header className="bg-light border-bottom">
      <div className="container py-3">
        <nav className="d-flex align-items-center justify-content-between">
          <Link to="/" className="text-decoration-none text-dark">
            <h1 className="m-0">Logo</h1>
          </Link>
          <div className="d-flex align-items-center gap-3">
            <Link to="/about" className="nav-link text-secondary">about us</Link>
            <Link to="/login" className="nav-link text-secondary">Log in</Link>
            <Link to="/RegisterForm">
              <button className="btn btn-dark">Sign up</button>
            </Link>
          </div>
        </nav>
        
      </div>
    </header>
  );
};