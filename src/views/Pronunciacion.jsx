import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import PalabraCard from "../components/pronunciacion/PalabraCard";

const Pronunciacion = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const palabras = [
    "apple",
    "banana",
    "orange",
    "grape",
    "watermelon",
    "kiwi",
    "strawberry",
    "blueberry",
    "pineapple",
    "mango",
  ];

  const [palabraActual, setPalabraActual] = useState("");
  const [resultado, setResultado] = useState(null);
  const [escuchando, setEscuchando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    generarNuevaPalabra();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          console.log("Permiso de micrófono concedido");
        })
        .catch((err) => {
          console.error("Permiso de micrófono denegado:", err);
          setError(
            "No se pudo acceder al micrófono. Por favor, habilítalo en la configuración del navegador."
          );
        });
    } else {
      setError("Este navegador no soporta acceso al micrófono.");
    }
  }, []);

  const generarNuevaPalabra = () => {
    const aleatoria = palabras[Math.floor(Math.random() * palabras.length)];
    setPalabraActual(aleatoria);
    setResultado(null);
    setError("");
  };

  const iniciarReconocimiento = () => {
    if (!SpeechRecognition) {
      setError("Este navegador no soporta reconocimiento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setEscuchando(true);
    setResultado(null);
    setError("");

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      const textolimpio = transcript.replace(/[.,!?¿¡;:]+$/, "");
      const objetivo = palabraActual.trim().toLowerCase();

      if (textolimpio === objetivo) {
        setResultado({ correcto: true, texto: textolimpio });
      } else {
        setResultado({ correcto: false, texto: textolimpio });
      }

      setEscuchando(false);
    };

    recognition.onerror = (event) => {
      setError("Error de reconocimiento: " + event.error);
      setEscuchando(false);
    };

    recognition.onend = () => {
      setEscuchando(false);
    };
  };

  return (
    <Container className="mt-5">
      <h2 className="text-center">Ejercicio de Pronunciación</h2>
      <PalabraCard
        palabra={palabraActual}
        escuchando={escuchando}
        resultado={resultado}
        error={error}
        onHablar={iniciarReconocimiento}
        onNueva={generarNuevaPalabra}
      />
    </Container>
  );
};

export default Pronunciacion;
