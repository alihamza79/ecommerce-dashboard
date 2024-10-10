// src/pages/Subscribers/SubscribersList.js

import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import TableContainer from "../../../Components/Common/TableContainer";
import { toast, ToastContainer } from "react-toastify";
import db from "../../../appwrite/Services/dbServices";

const SubscribersList = () => {
  // State variables
  const [subscribers, setSubscribers] = useState([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("");

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const response = await db.subscribers.list();
        const subscriberData = response.documents.map((doc) => ({
          id: doc.$id,
          email: doc.email,
        }));
        setSubscribers(subscriberData);
      } catch (error) {
        console.error("Failed to fetch subscribers:", error);
        toast.error("Failed to fetch subscribers");
      }
    };

    fetchSubscribers();
  }, []);

  const handleDeleteSelected = () => {
    setDeleteType("selected");
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === "selected") {
        const promises = selectedSubscribers.map((id) =>
          db.subscribers.delete(id)
        );
        await Promise.all(promises);
        setSubscribers(
          subscribers.filter(
            (subscriber) => !selectedSubscribers.includes(subscriber.id)
          )
        );
        setSelectedSubscribers([]);
        toast.success("Selected subscribers deleted successfully");
      } else if (deleteType === "all") {
        // Delete all subscribers
        const promises = subscribers.map((subscriber) =>
          db.subscribers.delete(subscriber.id)
        );
        await Promise.all(promises);
        setSubscribers([]);
        setSelectedSubscribers([]);
        toast.success("All subscribers deleted successfully");
      }
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete subscribers:", error);
      toast.error("Failed to delete subscribers");
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setDeleteType("");
  };

  const handleReplyAll = () => {
    const selectedEmails = subscribers
      .filter((subscriber) => selectedSubscribers.includes(subscriber.id))
      .map((subscriber) => subscriber.email)
      .filter((email) => !!email);

    if (selectedEmails.length === 0) {
      toast.warning("No email addresses found for selected subscribers");
      return;
    }

    const mailtoLink = `mailto:?bcc=${encodeURIComponent(
      selectedEmails.join(",")
    )}&subject=${encodeURIComponent("Your Subject Here")}&body=${encodeURIComponent(
      "Your message here."
    )}`;

    window.location.href = mailtoLink;
  };

  const handleReply = (email) => {
    if (!email) {
      toast.warning("No email address found");
      return;
    }

    const mailtoLink = `mailto:${encodeURIComponent(
      email
    )}?subject=${encodeURIComponent(
      "Your Subject Here"
    )}&body=${encodeURIComponent("Your message here.")}`;

    window.location.href = mailtoLink;
  };

  const columns = useMemo(
    () => [
      {
        id: "selection",
        header: () => (
          <input
            type="checkbox"
            className="form-check-input"
            checked={
              selectedSubscribers.length === subscribers.length &&
              selectedSubscribers.length > 0
            }
            onChange={(e) => {
              const checked = e.target.checked;
              const ids = subscribers.map((subscriber) => subscriber.id);
              setSelectedSubscribers(checked ? ids : []);
            }}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="subscriberCheckbox form-check-input"
            value={row.original.id}
            checked={selectedSubscribers.includes(row.original.id)}
            onChange={(e) => {
              const checked = e.target.checked;
              if (checked) {
                setSelectedSubscribers((prev) => [...prev, row.original.id]);
              } else {
                setSelectedSubscribers((prev) =>
                  prev.filter((id) => id !== row.original.id)
                );
              }
            }}
          />
        ),
      },
      {
        header: "Email",
        accessorKey: "email",
        cell: (info) => <span>{info.getValue()}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <>
            <Button
              color="primary"
              size="sm"
              onClick={() => handleReply(row.original.email)}
            >
              Reply
            </Button>
            <Button
              color="danger"
              size="sm"
              className="ms-2"
              onClick={() => {
                setSelectedSubscribers([row.original.id]);
                setDeleteType("selected");
                setDeleteModalOpen(true);
              }}
            >
              Delete
            </Button>
          </>
        ),
      },
    ],
    [selectedSubscribers, subscribers]
  );

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} limit={1} />
      <Container fluid>
        <h3>Subscribers List</h3>
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <div className="d-flex align-items-center justify-content-between">
                  {selectedSubscribers.length > 0 && (
                    <div className="d-flex align-items-center">
                      <Button
                        color="primary"
                        className="me-2"
                        onClick={handleReplyAll}
                      >
                        Reply All
                      </Button>
                      <Button
                        color="danger"
                        className="me-2"
                        onClick={handleDeleteSelected}
                      >
                        Delete Selected
                      </Button>
                    </div>
                  )}
                  
                </div>
              </CardHeader>
              <CardBody>
                {subscribers && subscribers.length > 0 ? (
                  <TableContainer
                    columns={columns}
                    data={subscribers}
                    isGlobalFilter={false}
                    isAddUserList={false}
                    customPageSize={10}
                    divClass="table-responsive"
                    tableClass="align-middle table-nowrap mb-0"
                    theadClass="table-light"
                  />
                ) : (
                  <div className="py-4 text-center">
                    <div>
                      <i
                        className="ri-search-line"
                        style={{ fontSize: "2rem" }}
                      ></i>
                    </div>
                    <div className="mt-4">
                      <h5>No subscribers found</h5>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} toggle={cancelDelete} centered>
        <ModalHeader toggle={cancelDelete}>Delete Confirmation</ModalHeader>
        <ModalBody>
          <p>
            Are you sure you want to delete{" "}
            {deleteType === "all"
              ? "all subscribers"
              : "the selected subscriber(s)"}?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={confirmDelete}>
            Delete
          </Button>
          <Button color="secondary" onClick={cancelDelete}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default SubscribersList;
