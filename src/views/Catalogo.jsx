import React, { useState, useEffect } from "react";
import { Container, Row, Form, Col } from "react-bootstrap";
import { db } from "../database/firebaseconfig";
import { collection, updateDoc, doc, onSnapshot } from "firebase/firestore";
import TarjetaProducto from "../components/catalogo/TarjetaProducto";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import Paginacion from "../components/ordenamiento/Paginacion";

const Catalogo = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [showEditModal, setShowEditModal] = useState(false);
  const [productoEditado, setProductoEditado] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const productosCollection = collection(db, "productos");
  const categoriasCollection = collection(db, "categorias");

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchData = () => {
    const unsubscribeProductos = onSnapshot(
      productosCollection,
      (snapshot) => {
        const fetchedProductos = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setProductos(fetchedProductos);
        if (isOffline) {
          console.log("Offline: Productos cargados desde la caché local.");
        }
      },
      (error) => {
        console.error("Error al escuchar productos:", error);
        if (isOffline) {
          console.log("Offline: Mostrando productos desde la caché local.");
        } else {
          alert("Error al cargar productos: " + error.message);
        }
      }
    );

    const unsubscribeCategorias = onSnapshot(
      categoriasCollection,
      (snapshot) => {
        const fetchedCategorias = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setCategorias(fetchedCategorias);
        if (isOffline) {
          console.log("Offline: Categorías cargadas desde la caché local.");
        }
      },
      (error) => {
        console.error("Error al escuchar categorías:", error);
        if (isOffline) {
          console.log("Offline: Mostrando categorías desde la caché local.");
        } else {
          alert("Error al cargar categorías: " + error.message);
        }
      }
    );

    return () => {
      unsubscribeProductos();
      unsubscribeCategorias();
    };
  };

  useEffect(() => {
    const cleanupListener = fetchData();
    return () => cleanupListener();
  });

  const productosFiltrados = productos
    .filter((producto) =>
      categoriaSeleccionada === "Todas"
        ? true
        : producto.categoria === categoriaSeleccionada
    )
    .filter((producto) =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const paginatedProductos = productosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openEditModal = (producto) => {
    setProductoEditado({ ...producto });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setProductoEditado((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductoEditado((prev) => ({
          ...prev,
          imagen: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProducto = async () => {
    if (
      !productoEditado?.nombre ||
      !productoEditado?.precio ||
      !productoEditado?.categoria
    ) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }

    // 🚨 Validar si es un registro temporal
    if (productoEditado.id.startsWith("temp_")) {
      alert(
        "Este producto todavía no se ha sincronizado con la nube. Intenta más tarde."
      );
      return;
    }

    setShowEditModal(false);

    const productoRef = doc(db, "productos", productoEditado.id);

    try {
      await updateDoc(productoRef, {
        nombre: productoEditado.nombre,
        precio: parseFloat(productoEditado.precio),
        categoria: productoEditado.categoria,
        imagen: productoEditado.imagen,
      });

      if (isOffline) {
        setProductos((prev) =>
          prev.map((prod) =>
            prod.id === productoEditado.id
              ? {
                  ...productoEditado,
                  precio: parseFloat(productoEditado.precio),
                }
              : prod
          )
        );
        console.log("Producto actualizado localmente (sin conexión).");
        alert(
          "Sin conexión: Producto actualizado localmente. Se sincronizará al reconectar."
        );
      } else {
        console.log("Producto actualizado exitosamente en la nube.");
      }
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      setProductos((prev) =>
        prev.map((prod) =>
          prod.id === productoEditado.id ? { ...prod } : prod
        )
      );
      alert("Error al actualizar el producto: " + error.message);
    }
  };

  return (
    <Container className="mt-5">
      <br />
      <h4>Catálogo de Productos</h4>

      <Row>
        <Col lg={3} md={3} sm={6}>
          <Form.Group className="mb-3">
            <Form.Label>Filtrar por categoría:</Form.Label>
            <Form.Select
              value={categoriaSeleccionada}
              onChange={(e) => {
                setCategoriaSeleccionada(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="Todas">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.nombre}>
                  {categoria.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col lg={3} md={3} sm={6}>
          <Form.Group className="mb-3">
            <Form.Label>Buscar producto:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingresa el nombre..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        {paginatedProductos.length > 0 ? (
          paginatedProductos.map((producto) => (
            <TarjetaProducto
              key={producto.id}
              producto={producto}
              openEditModal={openEditModal}
            />
          ))
        ) : (
          <p>
            No hay productos en esta categoría o que coincidan con la búsqueda.
          </p>
        )}
      </Row>

      <Paginacion
        itemsPerPage={itemsPerPage}
        totalItems={productosFiltrados.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <ModalEdicionProducto
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        productoEditado={productoEditado}
        handleEditInputChange={handleEditInputChange}
        handleEditImageChange={handleEditImageChange}
        handleEditProducto={handleEditProducto}
        categorias={categorias}
      />
    </Container>
  );
};

export default Catalogo;
