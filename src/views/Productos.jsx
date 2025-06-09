// Productos.jsx

import React, { useState, useEffect } from "react";
import { Container, Button, Form, Row, Col } from "react-bootstrap";
import { db } from "../database/firebaseconfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import TablaProductos from "../components/productos/TablaProductos";
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";
import Paginacion from "../components/ordenamiento/Paginacion";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    precio: "",
    categoria: "",
    imagen: "",
  });
  const [productoEditado, setProductoEditado] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const productosCollection = collection(db, "productos");
  const categoriasCollection = collection(db, "categorias");

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedProductos = productosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generarPDFProductos = () => {
    const doc = new jsPDF();
    // Encabezado
    doc.setFillColor(28, 41, 51);
    doc.rect(0, 0, 220, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text("Lista de Productos", doc.internal.pageSize.getWidth() / 2, 18, {
      align: "center",
    });

    // Tabla
    const columnas = ["#", "Nombre", "Precio", "Categoría"];
    const filas = productosFiltrados.map((prod, i) => [
      i + 1,
      prod.nombre,
      `C$${prod.precio}`,
      prod.categoria,
    ]);
    const totalPaginas = "{total_pages_count_string}";

    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 40,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      margin: { top: 20, left: 14, right: 14 },
      didDrawPage: (data) => {
        const h = doc.internal.pageSize.getHeight();
        const w = doc.internal.pageSize.getWidth();
        const pageNum = doc.internal.getNumberOfPages();
        const { pageCount } = data.settings; // Uso de `data` para obtener información de configuración
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const footer = `Página ${pageNum} de ${pageCount}`;
        doc.text(footer, w / 2 + 15, h - 10, { align: "center" });
      },
    });

    // Rellena el total real de páginas
    if (typeof doc.putTotalPages === "function") {
      doc.putTotalPages(totalPaginas);
    }

    // Guardar con fecha
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    doc.save(`productos_${dd}${mm}${yyyy}.pdf`);
  };

  const generarPDFDetalleProducto = (producto) => {
    const pdf = new jsPDF();
    // Encabezado
    pdf.setFillColor(28, 41, 51);
    pdf.rect(0, 0, 220, 30, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.text(producto.nombre, pdf.internal.pageSize.getWidth() / 2, 18, {
      align: "center",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    // Imagen (si existe)
    if (producto.imagen) {
      const propsImg = pdf.getImageProperties(producto.imagen);
      const imgW = 60;
      const imgH = (propsImg.height * imgW) / propsImg.width;
      const x = (pageWidth - imgW) / 2;
      pdf.addImage(producto.imagen, "JPEG", x, 40, imgW, imgH);

      // Texto debajo de la imagen
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text(`Precio: C$${producto.precio}`, pageWidth / 2, 40 + imgH + 10, {
        align: "center",
      });
      pdf.text(
        `Categoría: ${producto.categoria}`,
        pageWidth / 2,
        40 + imgH + 20,
        { align: "center" }
      );
    } else {
      // Si no hay imagen, muestra texto más arriba
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text(`Precio: C$${producto.precio}`, pageWidth / 2, 50, {
        align: "center",
      });
      pdf.text(`Categoría: ${producto.categoria}`, pageWidth / 2, 60, {
        align: "center",
      });
    }

    pdf.save(`${producto.nombre}.pdf`);
  };

  const exportarExcelProductos = () => {
    const datos = productosFiltrados.map((prod, i) => ({
      "#": i + 1,
      Nombre: prod.nombre,
      Precio: parseFloat(prod.precio),
      Categoría: prod.categoria,
    }));
    const sheet = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Productos");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const fileName = `Productos_${dd}${mm}${yyyy}.xlsx`;

    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const fetchData = () => {
    const unsubProd = onSnapshot(
      productosCollection,
      (snap) => {
        setProductos(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        if (isOffline) console.log("Offline: Productos desde caché");
      },
      (err) => {
        console.error(err);
        if (!isOffline) alert("Error al cargar productos: " + err.message);
      }
    );
    const unsubCat = onSnapshot(
      categoriasCollection,
      (snap) => {
        setCategorias(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      },
      (err) => {
        console.error(err);
        if (!isOffline) alert("Error al cargar categorías: " + err.message);
      }
    );
    return () => {
      unsubProd();
      unsubCat();
    };
  };

  useEffect(() => {
    const clean = fetchData();
    return () => clean();
  }, [isOffline]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((p) => ({ ...p, [name]: value }));
  };
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setProductoEditado((p) => ({ ...p, [name]: value }));
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setNuevoProducto((p) => ({ ...p, imagen: reader.result }));
    reader.readAsDataURL(file);
  };
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setProductoEditado((p) => ({ ...p, imagen: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleAddProducto = async () => {
    const { nombre, precio, categoria } = nuevoProducto;
    if (!nombre || !precio || !categoria) {
      alert("Completa todos los campos.");
      return;
    }
    setShowModal(false);
    const tempId = `temp_${Date.now()}`;
    setProductos((p) => [...p, { ...nuevoProducto, id: tempId }]);
    setNuevoProducto({ nombre: "", precio: "", categoria: "", imagen: "" });
    try {
      await addDoc(productosCollection, {
        nombre,
        precio: parseFloat(precio),
        categoria,
        imagen: nuevoProducto.imagen,
      });
      if (!isOffline) console.log("Producto agregado en nube");
    } catch (err) {
      console.error(err);
      if (!isOffline) {
        setProductos((p) => p.filter((x) => x.id !== tempId));
        alert("Error al agregar: " + err.message);
      }
    }
  };

  const handleEditProducto = async () => {
    if (
      !productoEditado?.nombre ||
      !productoEditado?.precio ||
      !productoEditado?.categoria
    ) {
      alert("Completa todos los campos.");
      return;
    }
    if (productoEditado.id.startsWith("temp_")) {
      alert("Aún no sincronizado, inténtalo luego.");
      return;
    }
    setShowEditModal(false);
    const ref = doc(db, "productos", productoEditado.id);
    try {
      await updateDoc(ref, {
        nombre: productoEditado.nombre,
        precio: parseFloat(productoEditado.precio),
        categoria: productoEditado.categoria,
        imagen: productoEditado.imagen,
      });
      if (isOffline) {
        setProductos((p) =>
          p.map((x) =>
            x.id === productoEditado.id ? { ...productoEditado } : x
          )
        );
        alert("Sin conexión: cambios locales pendientes.");
      }
    } catch (err) {
      console.error(err);
      setProductos((p) =>
        p.map((x) => (x.id === productoEditado.id ? x : x))
      );
      alert("Error al actualizar: " + err.message);
    }
  };

  const handleDeleteProducto = async () => {
    if (!productoAEliminar) return;
    if (productoAEliminar.id.startsWith("temp_")) {
      alert("Aún no sincronizado, inténtalo luego.");
      return;
    }
    setShowDeleteModal(false);
    setProductos((p) =>
      p.filter((x) => x.id !== productoAEliminar.id)
    );
    try {
      await deleteDoc(doc(db, "productos", productoAEliminar.id));
    } catch (err) {
      console.error(err);
      setProductos((p) => [...p, productoAEliminar]);
      alert("Error al eliminar: " + err.message);
    }
  };

  const openEditModal = (prod) => {
    setProductoEditado({ ...prod });
    setShowEditModal(true);
  };
  const openDeleteModal = (prod) => {
    setProductoAEliminar(prod);
    setShowDeleteModal(true);
  };
  const handleCopy = (prod) => {
    const txt = `Nombre: ${prod.nombre}, Precio: C$${prod.precio}, Categoría: ${prod.categoria}`;
    navigator.clipboard.writeText(txt).then(() => {
      alert("Copiado al portapapeles.");
    });
  };

  return (
    <Container className="mt-5">
      <h4>Gestión de Productos</h4>

      <Form.Group className="mb-3" controlId="formSearchProducto">
        <Form.Control
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      <Row className="mb-3">
        <Col lg={3} md={4} sm={4} xs={5}>
          <Button
            className="mb-3"
            onClick={() => setShowModal(true)}
            style={{ width: "100%" }}
          >
            Agregar producto
          </Button>
        </Col>
        <Col lg={3} md={4} sm={4} xs={5}>
          <Button
            className="mb-3"
            variant="secondary"
            onClick={generarPDFProductos}
            style={{ width: "100%" }}
          >
            Generar reporte PDF
          </Button>
        </Col>
        <Col lg={3} md={4} sm={4} xs={5}>
          <Button
            className="mb-3"
            variant="secondary"
            onClick={exportarExcelProductos}
            style={{ width: "100%" }}
          >
            Generar Excel
          </Button>
        </Col>
      </Row>

      <TablaProductos
        productos={paginatedProductos}
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
        handleCopy={handleCopy}
        generarPDFDetalleProducto={generarPDFDetalleProducto}
      />

      <Paginacion
        itemsPerPage={itemsPerPage}
        totalItems={productosFiltrados.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <ModalRegistroProducto
        showModal={showModal}
        setShowModal={setShowModal}
        nuevoProducto={nuevoProducto}
        handleInputChange={handleInputChange}
        handleImageChange={handleImageChange}
        handleAddProducto={handleAddProducto}
        categorias={categorias}
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
      <ModalEliminacionProducto
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDeleteProducto={handleDeleteProducto}
      />
    </Container>
  );
};

export default Productos;
