// src/components/productos/TablaProductos.jsx

import React from "react";
import { Table, Button, Image } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TablaProductos = ({
  productos,
  openEditModal,
  openDeleteModal,
  handleCopy,
  generarPDFDetalleProducto,
}) => {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Categoría</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {productos.map((producto) => (
          <tr key={producto.id}>
            <td>
              {producto.imagen && (
                <Image src={producto.imagen} width="50" height="50" rounded />
              )}
            </td>
            <td>{producto.nombre}</td>
            <td>C${producto.precio}</td>
            <td>{producto.categoria}</td>
            <td>
              {/* Botón Detalle PDF */}
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={() => generarPDFDetalleProducto(producto)}
                title="Generar PDF detalle"
              >
                <i className="bi bi-filetype-pdf"></i>
              </Button>

              {/* Botón Copiar */}
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => handleCopy(producto)}
                title="Copiar al portapapeles"
              >
                <i className="bi bi-clipboard"></i>
              </Button>

              {/* Botón Editar */}
              <Button
                variant="outline-warning"
                size="sm"
                className="me-2"
                onClick={() => openEditModal(producto)}
                title="Editar producto"
              >
                <i className="bi bi-pencil"></i>
              </Button>

              {/* Botón Eliminar */}
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => openDeleteModal(producto)}
                title="Eliminar producto"
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

export default TablaProductos;
