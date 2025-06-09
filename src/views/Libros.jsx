import React, { useState, useEffect } from "react";
import { Container, Button, Alert, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../database/firebaseconfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import TablaLibros from "../components/libros/TablaLibros";
import ModalRegistroLibro from "../components/libros/ModalRegistroLibro";
import ModalEdicionLibro from "../components/libros/ModalEdicionLibro";
import ModalEliminacionLibro from "../components/libros/ModalEliminacionLibro";
import Paginacion from "../components/ordenamiento/Paginacion";
import { useAuth } from "../database/authcontext";
import ModalQR from "../components/qr/ModalQR";

const Libros = () => {
  const [libros, setLibros] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nuevoLibro, setNuevoLibro] = useState({
    nombre: "",
    autor: "",
    genero: "",
    pdfUrl: "",
  });
  const [libroEditado, setLibroEditado] = useState(null);
  const [libroAEliminar, setLibroAEliminar] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const librosCollection = collection(db, "libros");
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

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

  const openQRModal = (url) => {
    setQrUrl(url);
    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setQrUrl("");
    setShowQRModal(false);
  };

  const fetchData = () => {
    const unsubscribeLibros = onSnapshot(
      librosCollection,
      (snapshot) => {
        const fetchedLibros = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setLibros(fetchedLibros);
        if (isOffline) {
          console.log("Offline: Libros cargados desde caché local.");
        }
      },
      (error) => {
        console.error("Error al escuchar libros:", error);
        if (isOffline) {
          console.log("Offline: Mostrando libros desde caché local.");
        } else {
          setError("Error al cargar los datos. Intenta de nuevo.");
        }
      }
    );

    return () => {
      unsubscribeLibros();
    };
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      const cleanupListener = fetchData();
      return () => cleanupListener();
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoLibro((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setLibroEditado((prev) => ({ ...prev, [name]: value }));
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Por favor, selecciona un archivo PDF.");
    }
  };

  const handleEditPdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Por favor, selecciona un archivo PDF.");
    }
  };

  const handleAddLibro = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para agregar un libro.");
      navigate("/login");
      return;
    }

    if (
      !nuevoLibro.nombre ||
      !nuevoLibro.autor ||
      !nuevoLibro.genero ||
      !pdfFile
    ) {
      alert("Por favor, completa todos los campos y selecciona un PDF.");
      return;
    }

    setShowModal(false);

    const tempId = `temp_${Date.now()}`;
    const libroConId = { ...nuevoLibro, id: tempId };

    try {
      setLibros((prev) => [...prev, libroConId]);

      const storageRef = ref(storage, `libros/${pdfFile.name}`);
      await uploadBytes(storageRef, pdfFile);
      const pdfUrl = await getDownloadURL(storageRef);

      await addDoc(librosCollection, { ...nuevoLibro, pdfUrl });

      setNuevoLibro({ nombre: "", autor: "", genero: "", pdfUrl: "" });
      setPdfFile(null);

      if (isOffline) {
        console.log("Libro agregado localmente (sin conexión).");
      } else {
        console.log("Libro agregado exitosamente en la nube.");
      }
    } catch (error) {
      console.error("Error al agregar libro:", error);
      if (isOffline) {
        console.log("Offline: Libro almacenado localmente.");
      } else {
        setLibros((prev) => prev.filter((libro) => libro.id !== tempId));
        setError("Error al agregar el libro. Intenta de nuevo.");
      }
    }
  };

  const handleEditLibro = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para editar un libro.");
      navigate("/login");
      return;
    }

    if (
      !libroEditado?.nombre ||
      !libroEditado?.autor ||
      !libroEditado?.genero
    ) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }

    if (libroEditado.id.startsWith("temp_")) {
      alert(
        "Este libro todavía no se ha sincronizado con la nube. Intenta más tarde."
      );
      return;
    }

    setShowEditModal(false);

    try {
      const libroRef = doc(db, "libros", libroEditado.id);

      if (pdfFile) {
        if (libroEditado.pdfUrl) {
          const oldPdfRef = ref(storage, libroEditado.pdfUrl);
          await deleteObject(oldPdfRef).catch((error) =>
            console.error("Error al eliminar el PDF anterior:", error)
          );
        }

        const storageRef = ref(storage, `libros/${pdfFile.name}`);
        await uploadBytes(storageRef, pdfFile);
        const newPdfUrl = await getDownloadURL(storageRef);

        await updateDoc(libroRef, { ...libroEditado, pdfUrl: newPdfUrl });
      } else {
        await updateDoc(libroRef, libroEditado);
      }

      setPdfFile(null);

      if (isOffline) {
        console.log("Libro actualizado localmente (sin conexión).");
        alert(
          "Sin conexión: Libro actualizado localmente. Se sincronizará al reconectar."
        );
      } else {
        console.log("Libro actualizado exitosamente en la nube.");
      }
    } catch (error) {
      console.error("Error al actualizar libro:", error);
      setError("Error al actualizar el libro. Intenta de nuevo.");
    }
  };

  const handleDeleteLibro = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para eliminar un libro.");
      navigate("/login");
      return;
    }

    if (!libroAEliminar) return;

    if (libroAEliminar.id.startsWith("temp_")) {
      alert(
        "Este libro todavía no se ha sincronizado con la nube. Intenta más tarde."
      );
      return;
    }

    setShowDeleteModal(false);

    try {
      const libroRef = doc(db, "libros", libroAEliminar.id);

      if (libroAEliminar.pdfUrl) {
        const pdfRef = ref(storage, libroAEliminar.pdfUrl);
        await deleteObject(pdfRef).catch((error) =>
          console.error("Error al eliminar el PDF de Storage:", error)
        );
      }

      await deleteDoc(libroRef);

      if (isOffline) {
        console.log("Libro eliminado localmente (sin conexión).");
      } else {
        console.log("Libro eliminado exitosamente en la nube.");
      }
    } catch (error) {
      console.error("Error al eliminar libro:", error);
      setError("Error al eliminar el libro. Intenta de nuevo.");
    }
  };

  const openEditModal = (libro) => {
    setLibroEditado({ ...libro });
    setShowEditModal(true);
  };

  const openDeleteModal = (libro) => {
    setLibroAEliminar(libro);
    setShowDeleteModal(true);
  };

  const librosFiltrados = libros.filter((libro) =>
    libro.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedLibros = librosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Container className="mt-5">
      <br />
      <h4>Gestión de Libros</h4>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Group className="mb-3" controlId="formSearchLibro">
        <Form.Control
          type="text"
          placeholder="Buscar libro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      <Button className="mb-3" onClick={() => setShowModal(true)}>
        Agregar libro
      </Button>

      <>
        <TablaLibros
          libros={paginatedLibros}
          openEditModal={openEditModal}
          openDeleteModal={openDeleteModal}
          openQRModal={openQRModal}
        />

        <Paginacion
          itemsPerPage={itemsPerPage}
          totalItems={librosFiltrados.length}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </>

      <ModalRegistroLibro
        showModal={showModal}
        setShowModal={setShowModal}
        nuevoLibro={nuevoLibro}
        handleInputChange={handleInputChange}
        handlePdfChange={handlePdfChange}
        handleAddLibro={handleAddLibro}
      />
      <ModalEdicionLibro
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        libroEditado={libroEditado}
        handleEditInputChange={handleEditInputChange}
        handleEditPdfChange={handleEditPdfChange}
        handleEditLibro={handleEditLibro}
      />
      <ModalEliminacionLibro
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDeleteLibro={handleDeleteLibro}
      />
      <ModalQR show={showQRModal} onHide={closeQRModal} url={qrUrl} />
    </Container>
  );
};

export default Libros;
