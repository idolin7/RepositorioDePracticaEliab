
import React from "react";
import { Bar } from "react-chartjs-2";
import { Card } from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar los componentes del gráfico
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const GraficoProductos = ({ nombres, precios }) => {
  const data = {
    labels: nombres,
    datasets: [
      {
        label: "Precios",
        data: precios,
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Gráfico de Productos",
        font: { size: 20 },
      },
      legend: {
        display: true,
        position: "top",
      },
    },
  };

  return (
    <Card className="p-3 shadow">
      <Bar data={data} options={options} />
    </Card>
  );
};

export default GraficoProductos;