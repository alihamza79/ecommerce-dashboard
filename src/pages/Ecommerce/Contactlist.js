// src/pages/ContactList.js

import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import TableContainer from "../../Components/Common/TableContainer";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import db from "../../appwrite/Services/dbServices";

const ContactList = () => {
  // State variables
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true); // Set loading to true when fetching starts
        const response = await db.contacts.list();
        const contactData = response.documents.map((doc) => ({
          id: doc.$id,
          name: doc.name,
          email: doc.email,
          phoneNumber: doc.phone,
          message: doc.comment,
          read: doc.read || false,
        }));
        setContacts(contactData);
        setFilteredContacts(contactData);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
        toast.error("Failed to fetch contacts");
      } finally {
        setIsLoading(false); // Set loading to false when fetching is done
      }
    };

    fetchContacts();
  }, []);

  useEffect(() => {
    let filtered = contacts;
    if (filter === "read") {
      filtered = contacts.filter((contact) => contact.read);
    } else if (filter === "unread") {
      filtered = contacts.filter((contact) => !contact.read);
    }
    setFilteredContacts(filtered);
  }, [filter, contacts]);

  const handleFilterChange = (selectedOption) => {
    setFilter(selectedOption.value);
  };

  const handleMarkAsRead = async (contact) => {
    try {
      await db.contacts.update(contact.id, { read: true });
      setContacts(
        contacts.map((c) =>
          c.id === contact.id ? { ...c, read: true } : c
        )
      );
      toast.success("Contact marked as read");
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const handleDeleteSelected = () => {
    setDeleteType("selected");
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === "selected") {
        const promises = selectedContacts.map((id) =>
          db.contacts.delete(id)
        );
        await Promise.all(promises);
        setContacts(
          contacts.filter((contact) => !selectedContacts.includes(contact.id))
        );
        setSelectedContacts([]);
        toast.success("Selected contacts deleted successfully");
      }
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete contacts:", error);
      toast.error("Failed to delete contacts");
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setDeleteType("");
  };

  const handleReplyAll = () => {
    const selectedEmails = contacts
      .filter((contact) => selectedContacts.includes(contact.id))
      .map((contact) => contact.email)
      .filter((email) => !!email);

    if (selectedEmails.length === 0) {
      toast.warning("No email addresses found for selected contacts");
      return;
    }

    const mailtoLink = `mailto:?bcc=${encodeURIComponent(
      selectedEmails.join(",")
    )}&subject=${encodeURIComponent(
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
              selectedContacts.length === filteredContacts.length &&
              selectedContacts.length > 0
            }
            onChange={(e) => {
              const checked = e.target.checked;
              const ids = filteredContacts.map((contact) => contact.id);
              setSelectedContacts(checked ? ids : []);
            }}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="contactCheckbox form-check-input"
            value={row.original.id}
            checked={selectedContacts.includes(row.original.id)}
            onChange={(e) => {
              const checked = e.target.checked;
              if (checked) {
                setSelectedContacts((prev) => [...prev, row.original.id]);
              } else {
                setSelectedContacts((prev) =>
                  prev.filter((id) => id !== row.original.id)
                );
              }
            }}
          />
        ),
      },
      {
        header: "Name",
        accessorKey: "name",
        cell: (info) => <span>{info.getValue()}</span>,
      },
      {
        header: "Email",
        accessorKey: "email",
        cell: (info) => <span>{info.getValue()}</span>,
      },
      {
        header: "Phone Number",
        accessorKey: "phoneNumber",
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
              onClick={() => {
                setSelectedContact(row.original);
                setIsModalOpen(true);
              }}
            >
              View Message
            </Button>
            {!row.original.read && (
              <Button
                color="success"
                size="sm"
                className="ms-2"
                onClick={() => handleMarkAsRead(row.original)}
              >
                Mark as Read
              </Button>
            )}
          </>
        ),
      },
    ],
    [selectedContacts, filteredContacts]
  );

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "read", label: "Read" },
    { value: "unread", label: "Unread" },
  ];

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} limit={1} />
      <Container fluid>
        <h3>Contact List</h3>
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <Select
                      value={filterOptions.find(
                        (option) => option.value === filter
                      )}
                      onChange={handleFilterChange}
                      options={filterOptions}
                      classNamePrefix="select2-selection"
                      placeholder="Select Filter"
                    />
                  </div>
                  {selectedContacts.length > 0 && (
                    <div className="flex-shrink-0 d-flex align-items-center">
                      <Button
                        color="primary"
                        className="me-2"
                        onClick={handleReplyAll}
                      >
                        Reply All
                      </Button>
                      <Button color="danger" onClick={handleDeleteSelected}>
                        Delete Selected
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                {isLoading ? (
                  // Loading Indicator
                  <div className="py-4 text-center">
                    <div>
                      <lord-icon
                        src="https://cdn.lordicon.com/msoeawqm.json"
                        trigger="loop"
                        colors="primary:#405189,secondary:#0ab39c"
                        style={{ width: "72px", height: "72px" }}
                      ></lord-icon>
                    </div>

                    <div className="mt-4">
                      <h5>Loading data!</h5>
                    </div>
                  </div>
                ) : filteredContacts && filteredContacts.length > 0 ? (
                  <TableContainer
                    columns={columns}
                    data={filteredContacts}
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
                      <h5>No contacts found</h5>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* View Message Modal */}
      <Modal
        isOpen={isModalOpen}
        toggle={() => setIsModalOpen(!isModalOpen)}
        centered
      >
        <ModalHeader toggle={() => setIsModalOpen(!isModalOpen)}>
          Contact Message
        </ModalHeader>
        <ModalBody>
          <p>{selectedContact && selectedContact.message}</p>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={() => {
              window.location.href = `mailto:${selectedContact.email}?subject=Reply&body=Hi ${selectedContact.name},%0D%0A%0D%0A`;
              setIsModalOpen(false);
            }}
          >
            Reply
          </Button>
          <Button color="secondary" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} toggle={cancelDelete} centered>
        <ModalHeader toggle={cancelDelete}>Delete Confirmation</ModalHeader>
        <ModalBody>
          <p>Are you sure you want to delete the selected contacts?</p>
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

export default ContactList;
