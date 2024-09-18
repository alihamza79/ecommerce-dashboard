import PropTypes from "prop-types";
import React, { useState } from "react";
import { Modal, ModalBody, Input } from "reactstrap";

const DeleteModal = ({ show, onDeleteClick, onCloseClick, requireConfirmation = false }) => {
  const [confirmationText, setConfirmationText] = useState("");

  const handleDeleteClick = () => {
    // Only delete if the confirmation input matches "delete my products"
    if (requireConfirmation && confirmationText !== "delete my products") {
      return;
    }
    onDeleteClick();
    setConfirmationText(""); // Reset input after deletion
  };

  return (
    <Modal fade={true} isOpen={show} toggle={onCloseClick} centered={true}>
      <ModalBody className="py-3 px-5">
        <div className="mt-2 text-center">
          <lord-icon
            src="https://cdn.lordicon.com/gsqxdxog.json"
            trigger="loop"
            colors="primary:#f7b84b,secondary:#f06548"
            style={{ width: "100px", height: "100px" }}
          ></lord-icon>
          <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
            <h4>Are you sure?</h4>
            <p className="text-muted mx-4 mb-0">
              {requireConfirmation
                ? 'To confirm, type "delete my products" below. This will delete the category and all associated products.'
                : 'Are you sure you want to remove this record?'}
            </p>
          </div>
        </div>

        {requireConfirmation && (
          <div className="mt-3 text-center">
            <Input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder='Type "delete my products" to confirm'
            />
          </div>
        )}

        <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
          <button
            type="button"
            className="btn w-sm btn-light"
            onClick={() => {
              setConfirmationText(""); // Reset input on close
              onCloseClick();
            }}
          >
            Close
          </button>
          <button
            type="button"
            className="btn w-sm btn-danger"
            onClick={handleDeleteClick}
            disabled={requireConfirmation && confirmationText !== "delete my products"}
          >
            Yes, Delete It!
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
};

DeleteModal.propTypes = {
  onCloseClick: PropTypes.func,
  onDeleteClick: PropTypes.func,
  show: PropTypes.any,
  requireConfirmation: PropTypes.bool, // New prop to control confirmation
};

export default DeleteModal;
