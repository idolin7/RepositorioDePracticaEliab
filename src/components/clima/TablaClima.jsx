import React from "react";
import { Table } from "react-bootstrap";

const TablaClima = ({ datosPorHora }) => {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Hora</th>
          <th>Temperatura (°C)</th>
        </tr>
      </thead>
      <tbody>
        {datosPorHora.map((dato, indice) => (
          <tr key={indice}>
            <td>{dato.hora}</td>
            <td>{dato.temperatura}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TablaClima;
