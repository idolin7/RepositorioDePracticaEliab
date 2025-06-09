import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import FormularioUbicacion from "../components/clima/FormularioUbicacion";
import TablaClima from "../components/clima/TablaClima";

const Clima = () => {
  const [ubicacion, setUbicacion] = useState({
    latitud: null,
    longitud: null,
    error: null,
  });

  const [datosPorHora, setDatosPorHora] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorClima, setErrorClima] = useState(null);

  const [ubicacionManual, setUbicacionManual] = useState({
    latitud: "",
    longitud: "",
  });

  const [modoUbicacion, setModoUbicacion] = useState("automatica");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const latitud = posicion.coords.latitude;
          const longitud = posicion.coords.longitude;
          setUbicacion({
            latitud,
            longitud,
            error: null,
          });
          setUbicacionManual({
            latitud: latitud.toString(),
            longitud: longitud.toString(),
          });
        },
        (error) => {
          setUbicacion((prev) => ({
            ...prev,
            error: `Error al obtener la ubicación: ${error.message}`,
          }));
        }
      );
    } else {
      alert("La geolocalización no es compatible con este navegador.");
      setUbicacion((prev) => ({
        ...prev,
        error: "La geolocalización no es compatible con este navegador.",
      }));
    }
  }, []);

  useEffect(() => {
    if (!ubicacion.latitud || !ubicacion.longitud) return;

    const obtenerDatosClima = async () => {
      setCargando(true);
      setErrorClima(null);

      try {
        const respuesta = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${ubicacion.latitud}&longitude=${ubicacion.longitud}&hourly=temperature_2m&forecast_days=1&timezone=auto`
        );
        if (!respuesta.ok) {
          throw new Error("Error al obtener los datos del clima");
        }
        const datos = await respuesta.json();
        const horas = datos.hourly.time;
        const temperaturas = datos.hourly.temperature_2m;
        const porHora = horas.map((hora, indice) => ({
          hora: new Date(hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          temperatura: temperaturas[indice],
        }));
        setDatosPorHora(porHora);
      } catch (error) {
        setErrorClima(error.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatosClima();
  }, [ubicacion.latitud, ubicacion.longitud]);

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setUbicacionManual((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const manejarCambioModo = (e) => {
    setModoUbicacion(e.target.value);
  };

  const manejarObtenerClima = (e) => {
    e.preventDefault();

    if (modoUbicacion === "automatica") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (posicion) => {
            const latitud = posicion.coords.latitude;
            const longitud = posicion.coords.longitude;
            setUbicacion({ latitud, longitud, error: null });
            setUbicacionManual({
              latitud: latitud.toString(),
              longitud: longitud.toString(),
            });
          },
          (error) => {
            setUbicacion({
              latitud: null,
              longitud: null,
              error: `Error al detectar la ubicación: ${error.message}`,
            });
          }
        );
      } else {
        setUbicacion({
          latitud: null,
          longitud: null,
          error: "La geolocalización no es compatible con este navegador.",
        });
      }
    } else {
      const latitud = parseFloat(ubicacionManual.latitud);
      const longitud = parseFloat(ubicacionManual.longitud);

      if (isNaN(latitud) || isNaN(longitud)) {
        setUbicacion({
          latitud: null,
          longitud: null,
          error: "Por favor, ingresa valores válidos para latitud y longitud.",
        });
        return;
      }

      setUbicacion({ latitud, longitud, error: null });
    }
  };

  return (
    <Container className="mt-5">
      <br />
      <h4>Clima por Hora</h4>
      <br />
      <FormularioUbicacion
        ubicacionManual={ubicacionManual}
        modoUbicacion={modoUbicacion}
        manejarCambioInput={manejarCambioInput}
        manejarCambioModo={manejarCambioModo}
        manejarObtenerClima={manejarObtenerClima}
      />

      <Row className="mt-4">
        <Col>
          {cargando ? (
            <p>Cargando datos del clima...</p>
          ) : errorClima ? (
            <p>{errorClima}</p>
          ) : datosPorHora.length > 0 ? (
            <TablaClima datosPorHora={datosPorHora} />
          ) : (
            <p>Por favor, ingresa o detecta una ubicación válida.</p>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Clima;