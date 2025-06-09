import React from "react";
import { Form, Button, Row, Col } from "react-bootstrap";

const FormularioUbicacion = ({
  ubicacionManual,
  modoUbicacion,
  manejarCambioInput,
  manejarCambioModo,
  manejarObtenerClima,
}) => {
  return (
    <Form onSubmit={manejarObtenerClima} >
      <h5>Seleccionar Ubicación</h5>
      <Row className="mb-3">
        <Col xs={12} sm={12} md={3} lg={3}>
          <Form.Check
            type="radio"
            label="Ubicación Automática"
            name="modoUbicacion"
            value="automatica"
            checked={modoUbicacion === "automatica"}
            onChange={manejarCambioModo}
          />
          <Form.Check
            type="radio"
            label="Ubicación Manual"
            name="modoUbicacion"
            value="manual"
            checked={modoUbicacion === "manual"}
            onChange={manejarCambioModo}
          />
        </Col>
        <Col xs={12} sm={12} md={4} lg={4}>
          <Form.Group controlId="latitud">
            <Form.Label>Latitud</Form.Label>
            <Form.Control
              type="text"
              name="latitud"
              value={ubicacionManual.latitud}
              onChange={manejarCambioInput}
              placeholder="Ej. 12.10629"
              disabled={modoUbicacion === "automatica"}
            />
          </Form.Group>
        </Col>
        <Col xs={12} sm={12} md={4} lg={4} className="mb-3">
          <Form.Group controlId="longitud">
            <Form.Label>Longitud</Form.Label>
            <Form.Control
              type="text"
              name="longitud"
              value={ubicacionManual.longitud}
              onChange={manejarCambioInput}
              placeholder="Ej. -85.36452"
              disabled={modoUbicacion === "automatica"}
            />
          </Form.Group>
        </Col>
        <Col xs={12} sm={12} md={1} lg={1} className="d-flex align-items-end justify-content-center mb-3">
          <Button variant="primary" type="submit">
            Cargar
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default FormularioUbicacion;
