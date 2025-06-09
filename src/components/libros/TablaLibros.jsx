import React from "react";
import { Table, Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TablaLibros = ({ libros, openEditModal, openDeleteModal, openQRModal }) => {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Autor</th>
          <th>Género</th>
          <th>PDF</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {libros.map((libro) => (
          <tr key={libro.id}>
            <td>{libro.nombre}</td>
            <td>{libro.autor}</td>
            <td>{libro.genero}</td>
            <td>
              {libro.pdfUrl && (
                <>
                  <a href={libro.pdfUrl} target="_blank" rel="noopener noreferrer">
                    Ver PDF
                  </a>
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="ms-2"
                    onClick={() => openQRModal(libro.pdfUrl)}
                  >
                    <i className="bi bi-qr-code"></i>
                  </Button>
                </>
              )}
            </td>
            <td>
              <Button
                variant="outline-warning"
                size="sm"
                className="me-2"
                onClick={() => openEditModal(libro)}
              >
                <i className="bi bi-pencil"></i>
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => openDeleteModal(libro)}
              >
                <i className="bi bi-trash"></i>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TablaLibros;
