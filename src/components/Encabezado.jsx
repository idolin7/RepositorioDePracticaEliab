import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Offcanvas from "react-bootstrap/Offcanvas";
import logo from "../assets/floristeria.png";
import { useAuth } from "../database/authcontext";
import 'bootstrap-icons/font/bootstrap-icons.css';
import "../App.css";

const Encabezado = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsCollapsed(false);
      localStorage.removeItem("adminEmail");
      localStorage.removeItem("adminPassword");
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleToggle = () => setIsCollapsed(!isCollapsed);

  const handleNavigate = (path) => {
    navigate(path);
    setIsCollapsed(false);
  };

  return (
    <Navbar expand="sm" fixed="top" className="color-navbar">
      <Container>
        <Navbar.Brand onClick={() => handleNavigate("/inicio")} className="text-black" style={{ cursor: "pointer" }}>
          <img alt="" src={logo} width="30" height="30" className="d-inline-block align-top logo-navbar" />{" "}
          <strong>Floristeria</strong>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="offcanvasNavbar-expand-sm" onClick={handleToggle} />
        <Navbar.Offcanvas
          id="offcanvasNavbar-expand-sm"
          aria-labelledby="offcanvasNavbarLabel-expand-sm"
          placement="end"
          show={isCollapsed}
          onHide={() => setIsCollapsed(false)}
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title
              id="offcanvasNavbarLabel-expand-sm"
              className="text-black"
            >
              Menú
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="justify-content-end flex-grow-1 pe-3">
              <Nav.Link
                onClick={() => handleNavigate("/inicio")}
                className="text-black"
              >
                <i className="bi-house-door-fill me-2"></i>
                <strong>Inicio</strong>
              </Nav.Link>
              <Nav.Link onClick={() => handleNavigate("/categorias")} className="text-black">
                Ir a Categorías
              </Nav.Link>
              <Nav.Link onClick={() => handleNavigate("/productos")} className="text-black">
                Ir a Productos
              </Nav.Link>
              <Nav.Link onClick={() => handleNavigate("/catalogo")} className="text-black">
                Ir a Catálogo
              </Nav.Link>
              <Nav.Link onClick={() => handleNavigate("/libros")} className="text-black">
                Ir a Libros
              </Nav.Link>
              <Nav.Link onClick={() => handleNavigate("/clima")} className="text-black">
                Ir a Clima
              </Nav.Link>
              <Nav.Link onClick={() => handleNavigate("/estadisticas")} className="text-black">
                Ir a Estadísticas
              </Nav.Link>
              {isLoggedIn ? (
                <Nav.Link onClick={handleLogout} className="text-black">
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Cerrar Sesión
                </Nav.Link>
              ) : location.pathname === "/" && (
                <Nav.Link
                  onClick={() => handleNavigate("/")}
                  className="text-black"
                >
                  Iniciar Sesión
                </Nav.Link>
              )}
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default Encabezado;