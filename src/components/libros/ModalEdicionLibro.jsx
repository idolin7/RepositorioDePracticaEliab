import React from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ModalEdicionLibro = ({
  showEditModal,
  setShowEditModal,
  libroEditado,
  handleEditInputChange,
  handleEditPdfChange,
  handleEditLibro,
}) => {
  if (!libroEditado) return null;

  return (
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Editar Libro</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={libroEditado.nombre}
              onChange={handleEditInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Autor</Form.Label>
            <Form.Control
              type="text"
              name="autor"
              value={libroEditado.autor}
              onChange={handleEditInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Género</Form.Label>
            <Form.Control
              type="text"
              name="genero"
              value={libroEditado.genero}
              onChange={handleEditInputChange}
              placeholder="Ej: Ficción, No Ficción, Fantasía"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Documento PDF Actual</Form.Label>
            {libroEditado.pdfUrl && (
              <div>
                <a href={libroEditado.pdfUrl} target="_blank" rel="noopener noreferrer">
                  Ver PDF actual
                </a>
              </div>
            )}
            <Form.Control type="file" accept="application/pdf" onChange={handleEditPdfChange} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleEditLibro}>
          Actualizar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEdicionLibro;