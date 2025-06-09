// components/qr/ModalQR.jsx
// Componente ModalQR para mostrar el código QR del PDF
import React from "react";
import { Modal } from "react-bootstrap";
import QRCode from "react-qr-code";

const ModalQR = ({ show, onHide, url }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Código QR del PDF</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {url ? <QRCode value={url} size={200} /> : <p>No hay URL disponible.</p>}
      </Modal.Body>
    </Modal>
  );
};

export default ModalQR;
