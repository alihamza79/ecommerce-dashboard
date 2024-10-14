// src/components/EcommerceOrders.js

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  CardHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  Modal,
  ModalHeader,
  Form,
  ModalBody,
  Label,
  Input,
  FormFeedback,
  Button
} from "reactstrap";
import moment from "moment";
import { Link } from "react-router-dom";
import classnames from "classnames";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import { isEmpty } from "lodash";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

// Import dbServices
import db from "../../../appwrite/Services/dbServices";

// Import other components and libraries
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ExportCSVModal from "../../../Components/Common/ExportCSVModal";

const EcommerceOrders = () => {
  // State Management
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modal, setModal] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  const [selectedOrder, setSelectedOrder] = useState(null); // Currently selected order
  const [isEdit, setIsEdit] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState(false);

  const [selectedCheckBoxDelete, setSelectedCheckBoxDelete] = useState([]);
  const [isMultiDeleteButton, setIsMultiDeleteButton] = useState(false);

  const [isExportCSV, setIsExportCSV] = useState(false);

  const [usersMap, setUsersMap] = useState({}); // Map userId to userName
  const [productsMap, setProductsMap] = useState({}); // Map productId to productName

  // Define options for order status and payment method
  const orderStatusOptions = [
    { label: "All", value: "All" },
    { label: "Pending", value: "Pending" },
    { label: "Inprogress", value: "Inprogress" },
    { label: "Pickups", value: "Pickups" },
    { label: "Returns", value: "Returns" },
    { label: "Delivered", value: "Delivered" },
  ];

  const paymentMethodOptions = [
    { label: "All", value: "All" },
    { label: "Mastercard", value: "Mastercard" },
    { label: "Paypal", value: "Paypal" },
    { label: "Visa", value: "Visa" },
    { label: "COD", value: "COD" },
  ];

  // **Added Helper Function to Generate Order Number**
  const getOrderNumber = (orderId) => {
    return `#${orderId.substring(0, 8).toUpperCase()}`;
  };

  // Toggle Modal
  const toggleModal = () => {
    setModal(!modal);
    if (modal) {
      setSelectedOrder(null);
      setIsEdit(false);
      formik.resetForm();
    }
  };

  // Handle Edit Order Click
  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setIsEdit(true);
    toggleModal();
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
      const orderId = selectedOrder.$id;
      await db.Orders.delete(orderId);
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.$id !== orderId)
      );
      setFilteredOrders((prevOrders) =>
        prevOrders.filter((order) => order.$id !== orderId)
      );
      toast.success("Order deleted successfully", { autoClose: 3000 });
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

  // Fetch Orders, OrderItems, Users, and Products from Appwrite
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Orders
      const ordersResponse = await db.Orders.list();
      const fetchedOrders = ordersResponse.documents;
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);

      // Fetch OrderItems
      const orderItemsMap = {};
      const allOrderItemsResponse = await db.OrderItems.list();
      const allOrderItems = allOrderItemsResponse.documents;
      allOrderItems.forEach((item) => {
        if (item.orderId) {
          if (orderItemsMap[item.orderId]) {
            orderItemsMap[item.orderId].push(item);
          } else {
            orderItemsMap[item.orderId] = [item];
          }
        }
      });
      setOrderItems(orderItemsMap);

      // Fetch Users
      const usersResponse = await db.Users.list();
      const fetchedUsers = usersResponse.documents;
      const usersMapLocal = {};
      fetchedUsers.forEach((user) => {
        usersMapLocal[user.userId] = user.name; // Adjust based on your Users schema
      });
      setUsersMap(usersMapLocal);

      // Fetch Products
      const productsResponse = await db.Products.list();
      const fetchedProducts = productsResponse.documents;
      const productsMapLocal = {};
      fetchedProducts.forEach((product) => {
        productsMapLocal[product.productId] = product.productName; // Adjust based on your Products schema
      });
      setProductsMap(productsMapLocal);
    } catch (err) {
      console.error("Fetch Data Error:", err);
      const errorMessage =
        (err.response && err.response.data && err.response.data.message) ||
        err.message ||
        "Failed to fetch orders.";
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    const selected = Array.from(document.querySelectorAll(".orderCheckBox:checked")).map(
      (checkbox) => checkbox.value
    );
    setSelectedCheckBoxDelete(selected);
    setIsMultiDeleteButton(selected.length > 0);
  };

  // Confirm Delete Multiple Orders
  const confirmDeleteMultipleOrders = async () => {
    if (selectedCheckBoxDelete.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        selectedCheckBoxDelete.map((orderId) => db.Orders.delete(orderId))
      );
      setOrders((prevOrders) =>
        prevOrders.filter((order) => !selectedCheckBoxDelete.includes(order.$id))
      );
      setFilteredOrders((prevOrders) =>
        prevOrders.filter((order) => !selectedCheckBoxDelete.includes(order.$id))
      );
      toast.success("Selected orders deleted successfully", { autoClose: 3000 });
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

  // Filter Orders Based on Tab Selection
  const handleTabClick = (tabId, statusType) => {
    setActiveTab(tabId);
    if (statusType === "All") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((order) => order.orderStatus === statusType);
      setFilteredOrders(filtered);
    }
  };

  // Formik for Edit Order Form
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: isEdit && selectedOrder ? {
      // Only include deliveryStatus in edit mode
      status: selectedOrder.orderStatus,
    } : {},
    validationSchema: Yup.object({
      status: Yup.string().required("Please select Delivery Status"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      if (isEdit) {
        // Only update the delivery status
        if (!selectedOrder) {
          toast.error("No order selected for editing.", { autoClose: 3000 });
          setSubmitting(false);
          return;
        }

        const updatedOrder = {
          orderStatus: values.status,
          updatedAt: new Date().toISOString(),
        };

        setLoading(true);
        try {
          const orderId = selectedOrder.$id;
          await db.Orders.update(orderId, updatedOrder);
          // Update local state
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.$id === orderId ? { ...order, ...updatedOrder } : order
            )
          );
          setFilteredOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.$id === orderId ? { ...order, ...updatedOrder } : order
            )
          );
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
        accessorKey: "$id", // Using $id as the accessor key for checkboxes
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
      // **Added "Order Number" Column**
      {
        header: "Order Number",
        accessorKey: "$id", // Using $id to generate Order Number
        enableColumnFilter: false,
        cell: (cell) => {
          const orderId = cell.getValue();
          return getOrderNumber(orderId);
        },
      },
      {
        header: "Customer",
        accessorKey: "userId", // Assuming order has 'userId' field
        enableColumnFilter: false,
        cell: (cell) => usersMap[cell.getValue()] || "N/A",
      },
      {
        header: "Product",
        accessorKey: "$id", // Using $id to fetch the first product
        enableColumnFilter: false,
        cell: (cell) => {
          const orderId = cell.getValue();
          const items = orderItems[orderId] || [];
          return items.length > 0 ? items[0].productName : "N/A";
        },
      },
      {
        header: "Order Date",
        accessorKey: "createdAt",
        enableColumnFilter: false,
        cell: (cell) =>
          moment(cell.getValue()).format("DD MMM YYYY, hh:mm A"),
      },
      {
        header: "Amount",
        accessorKey: "totalPrice",
        enableColumnFilter: false,
        cell: (cell) => `$${parseFloat(cell.getValue()).toFixed(2)}`,
      },
      {
        header: "Payment Method",
        accessorKey: "paymentMethod",
        enableColumnFilter: false,
      },
      {
        header: "Delivery Status",
        accessorKey: "orderStatus",
        enableColumnFilter: false,
        cell: (cell) => {
          const status = cell.getValue();
          const statusClasses = {
            Pending: "badge bg-warning-subtle text-warning",
            Inprogress: "badge bg-secondary-subtle text-secondary",
            Pickups: "badge bg-info-subtle text-info",
            Returns: "badge bg-primary-subtle text-primary",
            Delivered: "badge bg-success-subtle text-success",
          };
          return (
            <span className={statusClasses[status] || "badge bg-light text-dark"}>
              {status}
            </span>
          );
        },
      },
      {
        header: "Action",
        cell: (cellProps) => {
          const orderData = cellProps.row.original;
          return (
            <ul className="list-inline hstack gap-2 mb-0">
              <li className="list-inline-item">
                <Link
                  to={`/dashboard/orders/${orderData.$id}`}
                  className="text-primary d-inline-block"
                >
                  <i className="ri-eye-fill fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item edit">
                <Link
                  to="#"
                  className="text-primary d-inline-block edit-item-btn"
                  onClick={() => handleEditOrder(orderData)}
                >
                  <i className="ri-pencil-fill fs-16"></i>
                </Link>
              </li>
              <li className="list-inline-item">
                <Link
                  to="#"
                  className="text-danger d-inline-block remove-item-btn"
                  onClick={() => handleDeleteOrderClick(orderData)}
                >
                  <i className="ri-delete-bin-5-fill fs-16"></i>
                </Link>
              </li>
            </ul>
          );
        },
      },
    ],
    [orderItems, usersMap]
  );

  // Fetch orders, order items, users, and products on component mount
  useEffect(() => {
    if (isEmpty(orders)) {
      fetchData();
    }
  }, [fetchData, orders]);

  // Ensure badges are styled correctly based on status
  const getStatusBadge = (status) => {
    const statusClasses = {
      Pending: "badge bg-warning-subtle text-warning",
      Inprogress: "badge bg-secondary-subtle text-secondary",
      Pickups: "badge bg-info-subtle text-info",
      Returns: "badge bg-primary-subtle text-primary",
      Delivered: "badge bg-success-subtle text-success",
    };
    return statusClasses[status] || "badge bg-light text-dark";
  };

  document.title = "Orders | Velzon - React Admin & Dashboard Template";

  return (
    <div className="page-content">
      {/* Export CSV Modal */}
      <ExportCSVModal
        show={isExportCSV}
        onCloseClick={() => setIsExportCSV(false)}
        data={filteredOrders.map((order) => ({
          no: filteredOrders.indexOf(order) + 1,
          orderNumber: getOrderNumber(order.$id), // **Included Order Number**
          customer: usersMap[order.userId] || "N/A",
          product: orderItems[order.$id]?.[0]?.productName || "N/A",
          orderDate: moment(order.createdAt).format("DD MMM YYYY, hh:mm A"),
          amount: `$${parseFloat(order.totalPrice).toFixed(2)}`,
          paymentMethod: order.paymentMethod,
          deliveryStatus: order.orderStatus,
        }))}
        filename={`Orders_${moment().format("YYYYMMDD_HHmmss")}.csv`} // Dynamic filename with timestamp
      />

      {/* Delete Single Order Modal */}
      <DeleteModal
        show={deleteModal}
        onDeleteClick={confirmDeleteOrder}
        onCloseClick={() => setDeleteModal(false)}
      />

      {/* Delete Multiple Orders Modal */}
      <DeleteModal
        show={deleteModalMulti}
        onDeleteClick={confirmDeleteMultipleOrders}
        onCloseClick={() => setDeleteModalMulti(false)}
        title="Delete Multiple Orders"
        message="Are you sure you want to delete the selected orders?"
      />

      <Container fluid>
        {/* Breadcrumb */}
        <BreadCrumb title="Orders" pageTitle="Ecommerce" />

        <Row>
          <Col lg={12}>
            <Card id="orderList">
              <CardHeader className="border-0">
                <Row className="align-items-center gy-3">
                  <div className="col-sm">
                    <h5 className="card-title mb-0">Order History</h5>
                  </div>
                  <div className="col-sm-auto">
                    <div className="d-flex gap-1 flex-wrap">
                      {/* Removed "Create Order" Button */}
                      <Button color="info" onClick={() => setIsExportCSV(true)}>
                        <i className="ri-file-download-line align-bottom me-1"></i> Export
                      </Button>
                      {isMultiDeleteButton && (
                        <Button color="danger" onClick={() => setDeleteModalMulti(true)}>
                          <i className="ri-delete-bin-2-line"></i>
                        </Button>
                      )}
                    </div>
                  </div>
                </Row>
              </CardHeader>

              <CardBody className="pt-0">
                <div>
                  {/* Tabs for Filtering Orders */}
                  <Nav className="nav-tabs nav-tabs-custom nav-success" role="tablist">
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "1" }, "fw-semibold")}
                        onClick={() => handleTabClick("1", "All")}
                        href="#"
                      >
                        <i className="ri-store-2-fill me-1 align-bottom"></i> All Orders
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "2" }, "fw-semibold")}
                        onClick={() => handleTabClick("2", "Delivered")}
                        href="#"
                      >
                        <i className="ri-checkbox-circle-line me-1 align-bottom"></i> Delivered
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "3" }, "fw-semibold")}
                        onClick={() => handleTabClick("3", "Pickups")}
                        href="#"
                      >
                        <i className="ri-truck-line me-1 align-bottom"></i> Pickups{" "}
                        <span className="badge bg-danger align-middle ms-1">
                          {/* Optional dynamic count */}
                        </span>
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "4" }, "fw-semibold")}
                        onClick={() => handleTabClick("4", "Returns")}
                        href="#"
                      >
                        <i className="ri-arrow-left-right-fill me-1 align-bottom"></i> Returns
                      </NavLink>
                    </NavItem>
                    {/* Removed "Cancelled" Tab */}
                  </Nav>

                  {/* Table or Loader or Error */}
                  {loading ? (
                    <Loader />
                  ) : error ? (
                    <div className="alert alert-danger mt-3" role="alert">
                      {error}
                    </div>
                  ) : isEmpty(filteredOrders) ? (
                    <div className="alert alert-info mt-3" role="alert">
                      No orders found.
                    </div>
                  ) : (
                    <TableContainer
                      columns={columns}
                      data={filteredOrders}
                      isGlobalFilter={true}
                      isAddUserList={false}
                      customPageSize={8}
                      divClass="table-responsive table-card mb-1"
                      tableClass="align-middle table-nowrap"
                      theadClass="table-light text-muted"
                      handleOrderClick={() => {}}
                      isOrderFilter={true}
                      SearchPlaceholder="Search for customer, product, or delivery status..."
                    />
                  )}
                </div>

                {/* Edit Order Modal */}
                <Modal id="showModal" isOpen={modal} toggle={toggleModal} centered>
                  <ModalHeader className="bg-light p-3" toggle={toggleModal}>
                    {isEdit ? "Edit Delivery Status" : "Add Order"}
                  </ModalHeader>
                  <Form onSubmit={formik.handleSubmit}>
                    <ModalBody>
                      {isEdit ? (
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
                            {orderStatusOptions
                              .filter(option => option.value !== "All") // Exclude "All" in edit mode
                              .map((option, idx) => (
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
                        <Button
                          type="submit"
                          color="success"
                          disabled={formik.isSubmitting || loading}
                        >
                          {isEdit ? "Update Status" : "Add Order"}
                        </Button>
                      </div>
                    </div>
                  </Form>
                </Modal>

                {/* Toast Notifications */}
                <ToastContainer closeButton={false} limit={1} />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EcommerceOrders;
