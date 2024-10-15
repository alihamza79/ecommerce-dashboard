// src/components/EcommerceOrderDetail.js

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  CardHeader,
  Collapse,
  Label,
  Input,
  FormFeedback,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
} from "reactstrap";

import classnames from "classnames";
import { Link, useParams, useNavigate } from "react-router-dom";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ExportCSVModal from "../../../Components/Common/ExportCSVModal";

import { useFormik } from "formik";
import * as Yup from "yup";

import moment from "moment"; // Ensure moment is installed: npm install moment

// Import Appwrite services
import db from "../../../appwrite/Services/dbServices"; // Adjust the path as necessary
import { Query } from "appwrite"; // Import Query separately

// Import the EcommerceOrderProduct component
import EcommerceOrderProduct from "./EcommerceOrderProduct";

const EcommerceOrderDetail = () => {
  const { orderId } = useParams(); // Assuming orderId is passed via route parameters
  const navigate = useNavigate(); // For navigation after deletion

  // State Management
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  // Removed productsMap
  const [usersMap, setUsersMap] = useState({}); // Map userId to userName

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modal, setModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null); // Currently selected order

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState(false);

  const [selectedCheckBoxDelete, setSelectedCheckBoxDelete] = useState([]);
  const [isMultiDeleteButton, setIsMultiDeleteButton] = useState(false);

  const [isExportCSV, setIsExportCSV] = useState(false);

  // Define options for order status
  const orderStatusOptions = [
    { label: "Pending", value: "Pending" },
    { label: "In Progress", value: "Inprogress" },
    { label: "Pickups", value: "Pickups" },
    { label: "Returns", value: "Returns" },
    { label: "Delivered", value: "Delivered" },
    { label: "Cancelled", value: "Cancelled" },
  ];

  // Toggle Modal
  const toggleModal = () => {
    setModal(!modal);
    if (modal) {
      setSelectedOrder(null);
      formik.resetForm();
    }
  };

  // Handle Delete Order Click
  const handleDeleteOrderClick = (order) => {
    setSelectedOrder(order);
    setDeleteModal(true);
  };

  // Confirm Delete Order
  const confirmDeleteOrder = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      // Assuming 'Orders' is the collection name and correctly mapped in dbServices.js
      await db.Orders.delete(selectedOrder.$id);
      toast.success("Order deleted successfully", { autoClose: 3000 });
      navigate("/dashboard/orders"); // Redirect to orders list page
    } catch (err) {
      console.error("Delete Order Error:", err);
      const errorMessage =
        (err.response && err.response.data && err.response.data.message) ||
        err.message ||
        "Failed to delete order.";
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setLoading(false);
      setDeleteModal(false);
      setSelectedOrder(null);
    }
  };

  // Fetch Order Details
  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Order
      const orderResponse = await db.Orders.get(orderId);
      setOrder(orderResponse);

      // Fetch OrderItems
      const orderItemsResponse = await db.OrderItems.list([
        Query.equal("orderId", [orderId]), // Corrected Query.equal usage
      ]);
      setOrderItems(orderItemsResponse.documents); // Extract documents array

      // Removed fetching Products

      // Fetch User
      // Corrected Query to match 'userId' field
      const usersResponse = await db.Users.list([
        Query.equal("userId", [orderResponse.userId]),
      ]);

      if (usersResponse.documents.length > 0) {
        const user = usersResponse.documents[0];
        setUsersMap({ [user.userId]: user.name });
      } else {
        setUsersMap({}); // User not found
      }
    } catch (err) {
      console.error("Fetch Order Details Error:", err);
      const errorMessage =
        (err.response && err.response.data && err.response.data.message) ||
        err.message ||
        "Failed to fetch order details.";
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Handle Select All Checkbox
  const handleSelectAll = () => {
    const checkAll = document.getElementById("checkBoxAll");
    const checkboxes = document.querySelectorAll(".orderCheckBox");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = checkAll.checked;
    });
    handleCheckboxChange();
  };

  // Handle Individual Checkbox Change
  const handleCheckboxChange = () => {
    const selected = Array.from(
      document.querySelectorAll(".orderCheckBox:checked")
    ).map((checkbox) => checkbox.value);
    setSelectedCheckBoxDelete(selected);
    setIsMultiDeleteButton(selected.length > 0);
  };

  // Formik for Edit Order Form
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: selectedOrder
      ? {
          // Only include deliveryStatus in edit mode
          status: selectedOrder.orderStatus,
        }
      : {},
    validationSchema: Yup.object({
      status: Yup.string().required("Please select Delivery Status"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      if (selectedOrder) {
        // Only update the delivery status
        const updatedOrder = {
          orderStatus: values.status,
          updatedAt: new Date().toISOString(),
        };

        setLoading(true);
        try {
          await db.Orders.update(selectedOrder.$id, updatedOrder);
          // Update local state
          setOrder((prevOrder) => ({ ...prevOrder, ...updatedOrder }));
          toast.success("Order updated successfully", { autoClose: 3000 });
          toggleModal();
        } catch (err) {
          console.error("Update Order Error:", err);
          const errorMessage =
            (err.response && err.response.data && err.response.data.message) ||
            err.message ||
            "Failed to update order.";
          setError(errorMessage);
          toast.error(errorMessage, { autoClose: 5000 });
        } finally {
          setLoading(false);
          setSubmitting(false);
        }
      }
    },
  });

  // Calculate Total Amount
  const totalAmount = useMemo(() => {
    return orderItems
      .reduce((acc, item) => acc + item.price * item.quantity, 0)
      .toFixed(2);
  }, [orderItems]);

  // Define table columns based on Orders schema
  const columns = useMemo(
    () => [
      {
        header: (
          <input
            type="checkbox"
            id="checkBoxAll"
            className="form-check-input"
            onClick={handleSelectAll}
          />
        ),
        cell: (cell) => (
          <input
            type="checkbox"
            className="orderCheckBox form-check-input"
            value={cell.row.original.$id}
            onChange={handleCheckboxChange}
          />
        ),
        id: "#",
        accessorKey: "$id",
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: "No.",
        cell: (cell) => cell.row.index + 1,
        id: "serial",
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        header: "Product",
        accessorKey: "productName",
        enableColumnFilter: false,
        cell: (cell) => cell.getValue() || "N/A",
      },
      {
        header: "Item Price",
        accessorKey: "price",
        enableColumnFilter: false,
        cell: (cell) => `$${parseFloat(cell.getValue()).toFixed(2)}`,
      },
      {
        header: "Quantity",
        accessorKey: "quantity",
        enableColumnFilter: false,
      },
      {
        header: "Total Amount",
        accessorKey: "total",
        enableColumnFilter: false,
        cell: () => `$${totalAmount}`,
      },
    ],
    [totalAmount]
  );

  // Export CSV Data
  const exportCSVData = useMemo(() => {
    return orderItems.map((item, index) => ({
      no: index + 1,
      product: item.productName || "N/A",
      price: `$${parseFloat(item.price).toFixed(2)}`,
      quantity: item.quantity,
      total: `$${(item.price * item.quantity).toFixed(2)}`,
    }));
  }, [orderItems]);

  // Confirm Delete Multiple Orders (if needed)
  const confirmDeleteMultipleOrders = async () => {
    if (selectedCheckBoxDelete.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        selectedCheckBoxDelete.map((orderId) => db.Orders.delete(orderId))
      );
      toast.success("Selected orders deleted successfully", { autoClose: 3000 });
      navigate("/dashboard/orders"); // Redirect to orders list page
    } catch (err) {
      console.error("Delete Multiple Orders Error:", err);
      const errorMessage =
        (err.response && err.response.data && err.response.data.message) ||
        err.message ||
        "Failed to delete some orders.";
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setLoading(false);
      setDeleteModalMulti(false);
      setSelectedCheckBoxDelete([]);
      setIsMultiDeleteButton(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-3" role="alert">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="alert alert-info mt-3" role="alert">
        Order not found.
      </div>
    );
  }

  // Ensure 'orderNumber' exists in your Order schema. If not, consider adding it.
  const orderNumber = order.orderNumber || `#${order.$id.substring(0, 8).toUpperCase()}`;

  // Since 'address' is a simple string, no need to parse it as JSON
  const address = order.address || "N/A";

  return (
    <div className="page-content">
      <Container fluid>
        {/* Breadcrumb */}
        <BreadCrumb title="Order Details" pageTitle="Ecommerce" />

        <Row>
          <Col xl={9}>
            {/* Order Details Card */}
            <Card>
              <CardHeader>
                <div className="d-flex align-items-center">
                  <h5 className="card-title flex-grow-1 mb-0">Order {orderNumber}</h5>
                  <div className="flex-shrink-0">
                    <Button
                      color="success"
                      onClick={() => setIsExportCSV(true)}
                      size="sm"
                      className="me-2"
                    >
                      <i className="ri-file-download-line align-bottom me-1"></i> Export
                    </Button>
                    {/* Re-added Invoice Button */}
                    <Link
                      to={`/dashboard/invoices/${orderId}`} // Adjust the route as necessary
                      className="btn btn-primary btn-sm"
                    >
                      <i className="ri-download-2-fill align-bottom me-1"></i> Invoice
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="table-responsive table-card">
                  <table className="table table-nowrap align-middle table-borderless mb-0">
                    <thead className="table-light text-muted">
                      <tr>
                        <th scope="col">Product Details</th>
                        <th scope="col">Item Price</th>
                        <th scope="col">Quantity</th>
                        {/* Removed "Rating" Column */}
                        <th scope="col" className="text-end">
                          Total Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, key) => (
                        <EcommerceOrderProduct
                          item={item}
                          key={key}
                        />
                      ))}
                      <tr className="border-top border-top-dashed">
                        <td colSpan="3"></td>
                        <td className="fw-medium text-end">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td>Sub Total :</td>
                                <td className="text-end">${totalAmount}</td>
                              </tr>
                              {/* Add more summary rows if needed */}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            {/* Order Status Card */}
            <Card>
              <CardHeader>
                <div className="d-sm-flex align-items-center">
                  <h5 className="card-title flex-grow-1 mb-0">Order Status</h5>
                  <div className="flex-shrink-0 mt-2 mt-sm-0">
                    <Link
                      to="#"
                      className="btn btn-soft-info btn-sm mt-2 mt-sm-0"
                      onClick={() => {
                        setSelectedOrder(order);
                        toggleModal();
                      }}
                    >
                      <i className="ri-edit-line align-middle me-1"></i> Edit Status
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="profile-timeline">
                  <div className="accordion accordion-flush" id="accordionFlushExample">
                    {/* Current Order Status */}
                    <div className="accordion-item border-0">
                      <div className="accordion-header" id="headingOne">
                        <Link
                          to="#"
                          className={classnames(
                            "accordion-button",
                            "p-2",
                            "shadow-none",
                            { collapsed: !order.orderStatus }
                          )}
                        >
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 avatar-xs">
                              <div className={`avatar-title rounded-circle bg-${getStatusColor(order.orderStatus)}`}>
                                <i className={getStatusIcon(order.orderStatus)}></i>
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <h6 className="fs-15 mb-0 fw-semibold">
                                {order.orderStatus} -{" "}
                                <span className="fw-normal">
                                  {moment(order.updatedAt).format("ddd, DD MMM YYYY")}
                                </span>
                              </h6>
                            </div>
                          </div>
                        </Link>
                      </div>
                      <Collapse
                        id="collapseOne"
                        className="accordion-collapse"
                        isOpen={true} // Always open for current status
                      >
                        <div className="accordion-body ms-2 ps-5 pt-0">
                          <h6 className="mb-1">
                            {order.orderStatus} on{" "}
                            {moment(order.updatedAt).format("ddd, DD MMM YYYY - hh:mm A")}
                          </h6>
                          {/* Add more details if needed */}
                        </div>
                      </Collapse>
                    </div>
                    {/* Add more timeline items as per order status history if available */}
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col xl={3}>
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <div className="d-flex">
                  <h5 className="card-title flex-grow-1 mb-0">
                    Customer Details
                  </h5>
                  <div className="flex-shrink-0">
                    <Link to="#" className="link-secondary">
                      View Profile
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <ul className="list-unstyled mb-0 vstack gap-3">
                  <li>
                    <h6 className="fs-14 mb-1">{usersMap[order.userId] || "N/A"}</h6>
                  </li>
                  <li>
                    <i className="ri-mail-line me-2 align-middle text-muted fs-16"></i>
                    {order.email}
                  </li>
                  <li>
                    <i className="ri-phone-line me-2 align-middle text-muted fs-16"></i>
                    {order.phoneNumber}
                  </li>
                </ul>
              </CardBody>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">
                  <i className="ri-map-pin-line align-middle me-1 text-muted"></i>{" "}
                  Shipping Address
                </h5>
              </CardHeader>
              <CardBody>
                <ul className="list-unstyled vstack gap-2 fs-13 mb-0">
                  <li className="fw-medium fs-14">Address:</li>
                  <li>{address}</li>
                </ul>
              </CardBody>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">
                  <i className="ri-secure-payment-line align-bottom me-1 text-muted"></i>{" "}
                  Payment Details
                </h5>
              </CardHeader>
              <CardBody>
                {/* Display only Payment Method Name */}
                <div className="d-flex align-items-center mb-2">
                  <div className="flex-shrink-0">
                    <p className="text-muted mb-0">Payment Method:</p>
                  </div>
                  <div className="flex-grow-1 ms-2">
                    <h6 className="mb-0">{order.paymentMethod}</h6>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Export CSV Modal */}
        <ExportCSVModal
          show={isExportCSV}
          onCloseClick={() => setIsExportCSV(false)}
          data={exportCSVData}
          filename={`Order_${order.orderNumber || order.$id}.csv`} // Use orderNumber if available
        />

        {/* Delete Single Order Modal */}
        <DeleteModal
          show={deleteModal}
          onDeleteClick={confirmDeleteOrder}
          onCloseClick={() => setDeleteModal(false)}
          title="Delete Order"
          message="Are you sure you want to delete this order?"
        />

        {/* Delete Multiple Orders Modal */}
        <DeleteModal
          show={deleteModalMulti}
          onDeleteClick={confirmDeleteMultipleOrders}
          onCloseClick={() => setDeleteModalMulti(false)}
          title="Delete Multiple Orders"
          message="Are you sure you want to delete the selected orders?"
        />

        {/* Edit Order Modal */}
        <Modal id="showModal" isOpen={modal} toggle={toggleModal} centered>
          <ModalHeader className="bg-light p-3" toggle={toggleModal}>
            Edit Delivery Status
          </ModalHeader>
          <Form onSubmit={formik.handleSubmit}>
            <ModalBody>
              {selectedOrder ? (
                // Edit Mode: Only show Delivery Status field
                <div className="mb-3">
                  <Label htmlFor="status-field" className="form-label">
                    Delivery Status
                  </Label>
                  <Input
                    name="status"
                    id="status-field"
                    type="select"
                    className="form-select"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.status}
                    invalid={formik.touched.status && Boolean(formik.errors.status)}
                  >
                    <option value="">Select Delivery Status</option>
                    {orderStatusOptions.map((option, idx) => (
                      <option value={option.value} key={idx}>
                        {option.label}
                      </option>
                    ))}
                  </Input>
                  {formik.touched.status && formik.errors.status && (
                    <FormFeedback type="invalid">
                      {formik.errors.status}
                    </FormFeedback>
                  )}
                </div>
              ) : null /* Removed Add Order Fields */}
            </ModalBody>
            <div className="modal-footer">
              <div className="hstack gap-2 justify-content-end">
                <Button color="light" onClick={toggleModal}>
                  Close
                </Button>
                {selectedOrder && (
                  <Button
                    type="submit"
                    color="success"
                    disabled={formik.isSubmitting || loading}
                  >
                    Update Status
                  </Button>
                )}
              </div>
            </div>
          </Form>
        </Modal>

        {/* Toast Notifications */}
        <ToastContainer closeButton={false} limit={1} />
      </Container>
    </div>
  );
};

// Helper function to get status color
const getStatusColor = (status) => {
  const statusColors = {
    Pending: "warning",
    Inprogress: "secondary",
    Pickups: "info",
    Returns: "primary",
    Delivered: "success",
    Cancelled: "danger",
  };
  return statusColors[status] || "light";
};

// Helper function to get status icon
const getStatusIcon = (status) => {
  const statusIcons = {
    Pending: "ri-time-line",
    Inprogress: "ri-refresh-line",
    Pickups: "ri-truck-line",
    Returns: "ri-arrow-left-right-line",
    Delivered: "ri-check-line",
    Cancelled: "ri-close-line",
  };
  return statusIcons[status] || "ri-question-line";
};

export default EcommerceOrderDetail;
