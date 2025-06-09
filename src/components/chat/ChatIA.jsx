import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../database/firebaseconfig";
import { Button, Form, ListGroup, Spinner, Modal } from "react-bootstrap";

// Función para obtener respuesta desde Google AI API con intenciones completas
const obtenerRespuestaIA = async (promptUsuario) => {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  const prompt = `
    Analiza el mensaje del usuario: "${promptUsuario}".
    Determina la intención del usuario respecto a operaciones con categorías:
    - "crear"
    - "listar"
    - "actualizar"
    - "eliminar"
    - "seleccionar_categoria"
    - "actualizar_datos"
    Devuelve un JSON como:
    {
      "intencion": "crear|listar|actualizar|eliminar|seleccionar_categoria|actualizar_datos",
      "datos": { "nombre": "...", "descripcion": "..." },
      "seleccion": "..."
    }
    Si no detectas intención clara, devuelve { "intencion": "desconocida" }.
  `;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" },
        }),
      }
    );

    if (response.status === 429) {
      return { intencion: "error", mensaje: "Has alcanzado el límite de solicitudes. Intenta de nuevo más tarde." };
    }

    const data = await response.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const respuestaIA = JSON.parse(texto);

    if (!respuestaIA.intencion) {
      return { intencion: "desconocida" };
    }
    return respuestaIA;
  } catch (error) {
    console.error("Error al obtener respuesta de la IA:", error);
    return { intencion: "error", mensaje: "No se pudo conectar con la IA. Verifica tu conexión o API Key." };
  }
};

const ChatIA = ({ showChatModal, setShowChatModal }) => {
  // Estados
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [intencion, setIntencion] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // Referencias a colecciones
  const chatCollection = collection(db, "chat");
  const categoriasCollection = collection(db, "categorias");

  // Escucha mensajes en tiempo real
  useEffect(() => {
    const q = query(chatCollection, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMensajes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Obtener todas las categorías
  const obtenerCategorias = async () => {
    const snapshot = await getDocs(categoriasCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  // Función principal para enviar mensaje y procesar la respuesta de la IA
  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;

    const nuevoMensaje = {
      texto: mensaje,
      emisor: "usuario",
      timestamp: new Date(),
    };
    setCargando(true);
    setMensaje("");

    try {
      // 1️⃣ Guardar mensaje del usuario
      await addDoc(chatCollection, nuevoMensaje);

      // 2️⃣ Obtener respuesta de la IA
      const respuestaIA = await obtenerRespuestaIA(mensaje);
      // 3️⃣ Cargar categorías actuales
      const categorias = await obtenerCategorias();

      // 4️⃣ Manejo de intenciones
      if (respuestaIA.intencion === "listar") {
        if (categorias.length === 0) {
          await addDoc(chatCollection, {
            texto: "No hay categorías registradas.",
            emisor: "ia",
            timestamp: new Date(),
          });
        } else {
          const lista = categorias
            .map((cat, i) => `${i + 1}. ${cat.nombre}: ${cat.descripcion}`)
            .join("\n");
          await addDoc(chatCollection, {
            texto: `Categorías disponibles:\n${lista}`,
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (respuestaIA.intencion === "crear") {
        const datos = respuestaIA.datos || {};
        if (datos.nombre && datos.descripcion) {
          await addDoc(categoriasCollection, datos);
          await addDoc(chatCollection, {
            texto: `Categoría "${datos.nombre}" registrada con éxito.`,
            emisor: "ia",
            timestamp: new Date(),
          });
        } else {
          await addDoc(chatCollection, {
            texto: "No se pudo registrar la categoría. Faltan datos válidos.",
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (respuestaIA.intencion === "eliminar") {
        if (categorias.length === 0) {
          await addDoc(chatCollection, {
            texto: "No hay categorías registradas para eliminar.",
            emisor: "ia",
            timestamp: new Date(),
          });
          setIntencion(null);
        } else if (respuestaIA.seleccion) {
          const encontrada = categorias.find(
            (cat, i) =>
              cat.nombre.toLowerCase() === respuestaIA.seleccion.toLowerCase() ||
              parseInt(respuestaIA.seleccion) === i + 1
          );
          if (encontrada) {
            await deleteDoc(doc(db, "categorias", encontrada.id));
            await addDoc(chatCollection, {
              texto: `Categoría "${encontrada.nombre}" eliminada con éxito.`,
              emisor: "ia",
              timestamp: new Date(),
            });
            setIntencion(null);
          } else {
            await addDoc(chatCollection, {
              texto: "No se encontró la categoría especificada.",
              emisor: "ia",
              timestamp: new Date(),
            });
          }
        } else {
          setIntencion("eliminar");
          const lista = categorias
            .map((cat, i) => `${i + 1}. ${cat.nombre}: ${cat.descripcion}`)
            .join("\n");
          await addDoc(chatCollection, {
            texto: `Selecciona una categoría para eliminar:\n${lista}`,
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (intencion === "eliminar" && respuestaIA.intencion === "seleccionar_categoria") {
        const encontrada = categorias.find(
          (cat, i) =>
            cat.nombre.toLowerCase() === mensaje.toLowerCase() ||
            parseInt(mensaje) === i + 1
        );
        if (encontrada) {
          await deleteDoc(doc(db, "categorias", encontrada.id));
          await addDoc(chatCollection, {
            texto: `Categoría "${encontrada.nombre}" eliminada con éxito.`,
            emisor: "ia",
            timestamp: new Date(),
          });
          setIntencion(null);
        } else {
          await addDoc(chatCollection, {
            texto: "Selección inválida. Intenta con un número o nombre válido.",
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (respuestaIA.intencion === "actualizar") {
        if (categorias.length === 0) {
          await addDoc(chatCollection, {
            texto: "No hay categorías para actualizar.",
            emisor: "ia",
            timestamp: new Date(),
          });
          setIntencion(null);
        } else if (respuestaIA.seleccion) {
          const encontrada = categorias.find(
            (cat, i) =>
              cat.nombre.toLowerCase() === respuestaIA.seleccion.toLowerCase() ||
              parseInt(respuestaIA.seleccion) === i + 1
          );
          if (encontrada) {
            setCategoriaSeleccionada(encontrada);
            setIntencion("actualizar");
            await addDoc(chatCollection, {
              texto: `Seleccionaste "${encontrada.nombre}". Proporciona nuevos datos.`,
              emisor: "ia",
              timestamp: new Date(),
            });
          } else {
            await addDoc(chatCollection, {
              texto: "Categoría no encontrada.",
              emisor: "ia",
              timestamp: new Date(),
            });
          }
        } else {
          setIntencion("actualizar");
          const lista = categorias
            .map((cat, i) => `${i + 1}. ${cat.nombre}: ${cat.descripcion}`)
            .join("\n");
          await addDoc(chatCollection, {
            texto: `Selecciona una categoría para actualizar:\n${lista}`,
            emisor: "ia",
            timestamp: new Date(),
          });
        }
      }

      if (
        intencion === "actualizar" &&
        categoriaSeleccionada &&
        respuestaIA.intencion === "actualizar_datos"
      ) {
        const datos = respuestaIA.datos || {};
        const ref = doc(db, "categorias", categoriaSeleccionada.id);
        await updateDoc(ref, {
          nombre: datos.nombre || categoriaSeleccionada.nombre,
          descripcion: datos.descripcion || categoriaSeleccionada.descripcion,
        });
        await addDoc(chatCollection, {
          texto: `Categoría "${categoriaSeleccionada.nombre}" actualizada con éxito.`,
          emisor: "ia",
          timestamp: new Date(),
        });
        setIntencion(null);
        setCategoriaSeleccionada(null);
      }

      if (respuestaIA.intencion === "desconocida") {
        await addDoc(chatCollection, {
          texto: "No entendí tu solicitud. Usa crear, listar, actualizar o eliminar.",
          emisor: "ia",
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      await addDoc(chatCollection, {
        texto: "Ocurrió un error. Intenta más tarde.",
        emisor: "ia",
        timestamp: new Date(),
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal show={showChatModal} onHide={() => setShowChatModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chat con IA</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup style={{ maxHeight: "300px", overflowY: "auto" }}>
          {mensajes.map((msg) => (
            <ListGroup.Item
              key={msg.id}
              variant={msg.emisor === "ia" ? "light" : "primary"}
            >
              <strong>{msg.emisor === "ia" ? "IA: " : "Tú: "}</strong>
              {msg.texto}
            </ListGroup.Item>
          ))}
        </ListGroup>
        <Form.Control
          className="mt-3"
          type="text"
          placeholder="Escribe tu mensaje..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowChatModal(false)}>
          Cerrar
        </Button>
        <Button onClick={enviarMensaje} disabled={cargando}>
          {cargando ? <Spinner size="sm" animation="border" /> : "Enviar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChatIA;
