// views/Estadisticas.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../database/firebaseconfig";
import GraficoProductos from "../components/estadisticas/GraficoProductos";

const Estadisticas = () => {
  const [productos, setProductos] = useState([]);
  const productosCollection = collection(db, "productos");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      productosCollection,
      (snapshot) => {
        const fetchedProductos = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setProductos(fetchedProductos);
      },
      (error) => {
        console.error("Error al cargar productos:", error);
        alert("Error al cargar productos: " + error.message);
      }
    );

    return () => unsubscribe();
  });

  const nombres = productos.map((producto) => producto.nombre);
  const precios = productos.map((producto) =>
    parseFloat(producto.precio || 0)
  );

  return (
    <Container className="mt-5">
      <br />
      <h4>Estadísticas</h4>
      <Row className="mt-4">
        <Col xs={12} sm={12} md={12} lg={6} className="mb-4">
          <GraficoProductos nombres={nombres} precios={precios} />
        </Col>
      </Row>
    </Container>
  );
};

export default Estadisticas;
