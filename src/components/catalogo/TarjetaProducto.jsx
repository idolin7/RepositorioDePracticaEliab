import { Card, Col, Button } from "react-bootstrap";

const TarjetaProducto = ({ producto, openEditModal }) => {
  return (
    <Col lg={3} md={4} sm={12} className="mb-4 d-flex">
      <Card className="h-100">
        {producto.imagen && (
          <Card.Img
            variant="top"
            src={producto.imagen}
            alt={producto.nombre}
            style={{ height: "200px", objectFit: "cover" }}
          />
        )}
        <Card.Body>
          <Card.Title>{producto.nombre}</Card.Title>
          <Card.Text>
            Precio: C${producto.precio} <br />
            Categoría: {producto.categoria}
          </Card.Text>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => openEditModal(producto)}
          >
            Editar
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default TarjetaProducto;
