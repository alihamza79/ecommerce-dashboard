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
  Button,
} from "reactstrap";
import moment from "moment";
import { Link } from "react-router-dom";
import classnames from "classnames";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import { isEmpty } from "lodash";

// Formik and Yup for form handling
import * as Yup from "yup";
import { useFormik } from "formik";

// Import dbServices
import db from "../../../appwrite/Services/dbServices";

// Import other components and libraries
import Loader from "../../../Components/Common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ExportCSVModal from "../../../Components/Common/ExportCSVModal";

import { Query } from "appwrite"; // Ensure correct import
import Flatpickr from "react-flatpickr";

const EcommerceOrders = () => {
  // State Management
  const [orders, setOrders] = useState([]);
  // Removed orderItems state as it's no longer needed
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

  // Removed productsMap state as it's no longer needed

  // New State for Date Range Filtering
  const [dateRange, setDateRange] = useState([]); // Holds [fromDate, toDate]

  // Pagination States
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

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

  // Helper Function to Generate Order Number
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

  // Fetch Products - Removed as not needed

  // Fetch Orders and OrderItems
  const fetchOrdersAndItems = useCallback(async () => {
    if (!hasMore) return; // No more orders to fetch

    setLoading(true);
    setError(null);
    try {
      const queries = [];

      // Filter based on date range
      if (dateRange.length === 2) {
        const [fromDate, toDate] = dateRange;
        const fromDateTime = moment(fromDate).startOf("day").toISOString();
        const toDateTime = moment(toDate).endOf("day").toISOString();
        queries.push(Query.greaterThanEqual("createdAt", fromDateTime));
        queries.push(Query.lessThanEqual("createdAt", toDateTime));
      }

      // Add ordering and limit
      queries.push(Query.orderDesc("createdAt")); // Order by latest first
      queries.push(Query.limit(100)); // Set limit to 100 (Appwrite's maximum per request)

      // Optionally select specific fields to optimize data transfer
      queries.push(
        Query.select([
          "$id",
          "orderStatus",
          "createdAt",
          "totalPrice",
          "paymentMethod",
          "customerFirstName",
          "customerLastName",
        ])
      );

      // Add cursor if exists for pagination
      if (cursor) {
        queries.push(Query.cursorAfter(cursor));
      }

      // Fetch Orders with Queries
      const ordersResponse = await db.Orders.list(queries);
      const fetchedOrders = ordersResponse.documents;

      if (fetchedOrders.length < 100) {
        setHasMore(false); // No more orders to fetch
      } else {
        const lastOrder = fetchedOrders[fetchedOrders.length - 1];
        setCursor(lastOrder.$id);
      }

      // Add orderNumber to each order
      const ordersWithNumber = fetchedOrders.map((order) => ({
        ...order,
        orderNumber: getOrderNumber(order.$id),
      }));

      setOrders((prevOrders) => [...prevOrders, ...ordersWithNumber]);
      setFilteredOrders((prevOrders) => [...prevOrders, ...ordersWithNumber]);

      // If there are no orders, clear orderItems
      if (isEmpty(fetchedOrders)) {
        // No orderItems to set
        return;
      }

      // Fetch OrderItems for the fetched orders - Removed as not needed
      // Removed the entire block fetching order items
    } catch (err) {
      console.error("Fetch Orders and Items Error:", err);
      const errorMessage =
        (err.response && err.response.data && err.response.data.message) ||
        err.message ||
        "Failed to fetch orders.";
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  }, [dateRange, cursor, hasMore]);

  // Helper to map activeTab to status
  const activeTabToStatus = (tabId) => {
    switch (tabId) {
      case "2":
        return "Delivered";
      case "3":
        return "Pickups";
      case "4":
        return "Returns";
      default:
        return "All";
    }
  };

  // Use useEffect to fetch Products once on mount - Removed as not needed
  // Removed useEffect for fetchProducts

  // Use useEffect to fetch Orders and OrderItems when dateRange or cursor changes
  useEffect(() => {
    fetchOrdersAndItems();
  }, [fetchOrdersAndItems]);

  // Memoized function to filter orders based on activeTab
  const applyTabFilter = useCallback(() => {
    if (activeTab === "1") {
      // All Orders
      setFilteredOrders(orders);
    } else {
      const status = activeTabToStatus(activeTab);
      const filtered = orders.filter((order) => order.orderStatus === status);
      setFilteredOrders(filtered);
    }
  }, [activeTab, orders]);

  // Use useEffect to apply tab filter whenever activeTab or orders change
  useEffect(() => {
    applyTabFilter();
  }, [activeTab, orders, applyTabFilter]);

  // Handle Select All Checkbox
  const handleSelectAll = () => {
    const isChecked =
      selectedCheckBoxDelete.length === filteredOrders.length &&
      filteredOrders.length > 0;
    if (isChecked) {
      setSelectedCheckBoxDelete([]);
      setIsMultiDeleteButton(false);
    } else {
      const allOrderIds = filteredOrders.map((order) => order.$id);
      setSelectedCheckBoxDelete(allOrderIds);
      setIsMultiDeleteButton(true);
    }
  };

  // Handle Individual Checkbox Change
  const handleCheckboxChange = (orderId) => {
    setSelectedCheckBoxDelete((prevSelected) => {
      if (prevSelected.includes(orderId)) {
        const updatedSelected = prevSelected.filter((id) => id !== orderId);
        setIsMultiDeleteButton(updatedSelected.length > 0);
        return updatedSelected;
      } else {
        const updatedSelected = [...prevSelected, orderId];
        setIsMultiDeleteButton(updatedSelected.length > 0);
        return updatedSelected;
      }
    });
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
      setSelectedCheckBoxDelete([]);
      setIsMultiDeleteButton(false);
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
    }
  };

  // Filter Orders Based on Tab Selection
  const handleTabClick = (tabId, statusType) => {
    setActiveTab(tabId);
    // Reset filtered orders when tab changes
    // applyTabFilter will be called via useEffect due to dependency on activeTab
  };

  // Formik for Edit Order Form
  const formik = useFormik({
    enableReinitialize: true,
    initialValues:
      isEdit && selectedOrder
        ? {
            // Only include deliveryStatus in edit mode
            status: selectedOrder.orderStatus,
          }
        : {},
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
            checked={
              selectedCheckBoxDelete.length === filteredOrders.length &&
              filteredOrders.length > 0
            }
            onChange={handleSelectAll}
          />
        ),
        cell: (cell) => (
          <input
            type="checkbox"
            className="orderCheckBox form-check-input"
            value={cell.row.original.$id}
            checked={selectedCheckBoxDelete.includes(cell.row.original.$id)}
            onChange={() => handleCheckboxChange(cell.row.original.$id)}
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
      // Added "Order Number" Column
      {
        header: "Order Number",
        accessorKey: "orderNumber", // Using orderNumber from data
        enableColumnFilter: false,
        cell: (cell) => {
          const orderNumber = cell.getValue();
          return orderNumber;
        },
      },
      {
        header: "Customer",
        accessorKey: "customerFirstName", // Using customerFirstName and customerLastName
        enableColumnFilter: false,
        cell: (cell) => {
          const firstName = cell.row.original.customerFirstName || "";
          const lastName = cell.row.original.customerLastName || "";
          return `${firstName} ${lastName}`.trim() || "N/A";
        },
      },
      // Removed "Product" Column
      /*
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
      */
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
    [selectedCheckBoxDelete, filteredOrders.length]
    // Removed orderItems from dependencies
  );

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
        data={filteredOrders.map((order, index) => ({
          no: index + 1,
          orderNumber: order.orderNumber, // Included Order Number
          customer: `${order.customerFirstName || ""} ${
            order.customerLastName || ""
          }`.trim() || "N/A",
          // Removed 'product' field from CSV export
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
                      {/* Date Range Filter with Input Group */}
                      <div className="col-sm-auto">
                        <div className="input-group me-2">
                          <Flatpickr
                            id="dateRange"
                            className="form-control border-0 dash-filter-picker shadow"
                            options={{
                              mode: "range",
                              dateFormat: "d M, Y",
                            }}
                            value={dateRange}
                            onChange={(selectedDates) => {
                              setDateRange(selectedDates);
                              // Reset pagination when date range changes
                              setOrders([]);
                              setFilteredOrders([]);
                              setCursor(null);
                              setHasMore(true);
                            }}
                            placeholder="Select Date Range"
                          />
                          <div className="input-group-text bg-primary border-primary text-white">
                            <i className="ri-calendar-2-line"></i>
                          </div>
                        </div>
                      </div>
                      {/* Reset Button */}
                      <Button
                        color="secondary"
                        onClick={() => {
                          setDateRange([]);
                          setOrders([]);
                          setFilteredOrders([]);
                          setCursor(null);
                          setHasMore(true);
                          // fetchOrdersAndItems will be called via useEffect
                        }}
                        className="me-2"
                      >
                        <i className="ri-refresh-line align-bottom me-1"></i> Reset
                      </Button>
                      {/* Export CSV Button */}
                      <Button
                        color="info"
                        onClick={() => setIsExportCSV(true)}
                        className="me-2"
                      >
                        <i className="ri-file-download-line align-bottom me-1"></i> Export
                      </Button>
                      {isMultiDeleteButton && (
                        <Button
                          color="danger"
                          onClick={() => setDeleteModalMulti(true)}
                        >
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
                  <Nav
                    className="nav-tabs nav-tabs-custom nav-success"
                    role="tablist"
                  >
                    <NavItem>
                      <NavLink
                        className={classnames(
                          { active: activeTab === "1" },
                          "fw-semibold"
                        )}
                        onClick={() => handleTabClick("1", "All")}
                        href="#"
                      >
                        <i className="ri-store-2-fill me-1 align-bottom"></i> All Orders
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames(
                          { active: activeTab === "2" },
                          "fw-semibold"
                        )}
                        onClick={() => handleTabClick("2", "Delivered")}
                        href="#"
                      >
                        <i className="ri-checkbox-circle-line me-1 align-bottom"></i> Delivered
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames(
                          { active: activeTab === "3" },
                          "fw-semibold"
                        )}
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
                        className={classnames(
                          { active: activeTab === "4" },
                          "fw-semibold"
                        )}
                        onClick={() => handleTabClick("4", "Returns")}
                        href="#"
                      >
                        <i className="ri-arrow-left-right-fill me-1 align-bottom"></i> Returns
                      </NavLink>
                    </NavItem>
                    {/* Removed "Cancelled" Tab */}
                  </Nav>

                  {/* Table or Loader or Error */}
                  {loading && orders.length === 0 ? (
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
                    <>
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
                        SearchPlaceholder="Search for order number or customer..."
                        globalFilterFn="fuzzy" // Ensure 'fuzzy' is used for flexible searching
                        filterFields={["orderNumber", "customerFirstName", "customerLastName"]} // Specify fields to filter on
                      />
                      {/* Load More Button for Pagination */}
                      {hasMore && (
                        <div className="d-flex justify-content-center mt-3">
                          <Button
                            color="primary"
                            onClick={fetchOrdersAndItems}
                            disabled={loading}
                          >
                            {loading ? "Loading..." : "Load More"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Edit Order Modal */}
                <Modal
                  id="showModal"
                  isOpen={modal}
                  toggle={toggleModal}
                  centered
                >
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
                            invalid={
                              formik.touched.status &&
                              Boolean(formik.errors.status)
                            }
                          >
                            <option value="">Select Delivery Status</option>
                            {orderStatusOptions
                              .filter((option) => option.value !== "All") // Exclude "All" in edit mode
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

// Helper function to get status color
const getStatusColor = (status) => {
  const statusColors = {
    Pending: "warning",
    Inprogress: "secondary",
    Pickups: "info",
    Returns: "primary",
    Delivered: "success",
  };
  return statusColors[status] || "light";
};

export default EcommerceOrders;
