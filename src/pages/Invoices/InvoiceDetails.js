// src/components/InvoiceDetails.js

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  CardBody,
  Row,
  Col,
  Card,
  Table,
  CardHeader,
  Container,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { Link, useParams } from "react-router-dom";

import logoDark from "../../assets/images/logo-dark.png";
import logoLight from "../../assets/images/logo-light.png";

import db from "../../appwrite/Services/dbServices"; // Import dbServices
import { Query } from "appwrite"; // Import Query

// Import jsPDF and html2canvas
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const InvoiceDetails = () => {
  const { orderId } = useParams(); // Get orderId from route parameters
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [productsMap, setProductsMap] = useState({}); // Map productId to productName

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      // Fetch Products
      const productsResponse = await db.Products.list();
      const fetchedProducts = productsResponse.documents;
      const productsMapLocal = {};
      fetchedProducts.forEach((product) => {
        productsMapLocal[product.productId] = product.productName; // Adjust based on your Products schema
      });
      setProductsMap(productsMapLocal);
    } catch (err) {
      console.error("Fetch Products Error:", err);
      const errorMessage =
        (err.response && err.response.data && err.response.data.message) ||
        err.message ||
        "Failed to fetch products.";
      setError(errorMessage);
    }
  }, []);

  // Fetch Order Details
  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch order data
      const orderData = await db.Orders.get(orderId);
      setOrder(orderData);

      // Fetch order items
      const orderItemsResponse = await db.OrderItems.list([
        Query.equal("orderId", [orderId]),
      ]);
      setOrderItems(orderItemsResponse.documents);
    } catch (err) {
      console.error("Fetch Order Details Error:", err);
      const errorMessage =
        (err.response && err.response.data && err.response.data.message) ||
        err.message ||
        "Failed to fetch order details.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchProducts();
    fetchOrderDetails();
  }, [fetchProducts, fetchOrderDetails]);

  // Print the Invoice
  const printInvoice = () => {
    window.print();
  };

  // Function to download the invoice as PDF
  const downloadInvoice = () => {
    const input = document.getElementById("invoice-content");
    html2canvas(input, { scale: 2 }) // Increase scale for better quality
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        // Calculate width and height to fit the page
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice_${order.$id.substring(0, 8)}.pdf`);
      })
      .catch((err) => {
        console.error("Error generating PDF", err);
      });
  };

  document.title = "Invoice Details | Your App Name";

  if (loading) {
    return <div>Loading...</div>;
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

  // Calculate totals
  const subTotal = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shippingCharge = 0; // Adjust shipping charge if needed
  const totalAmount = subTotal + shippingCharge;

  // Construct Order Number
  const orderNumber =
    order.orderNumber || `#${order.$id.substring(0, 8).toUpperCase()}`;

  // Construct Address from Order Fields
  const address = [
    order.addressLine1,
    order.addressLine2,
    order.city,
    order.region,
    order.postalCode,
    order.country,
  ]
    .filter((line) => line) // Remove undefined or empty fields
    .join(", ") || "N/A";

  // Construct Customer Name
  const customerName = `${order.customerFirstName || ""} ${
    order.customerLastName || ""
  }`.trim() || "N/A";

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Invoice Details" pageTitle="Invoices" />

        <Row className="justify-content-center">
          <Col xxl={9}>
            {/* Wrap the invoice content in a div with id 'invoice-content' */}
            <div id="invoice-content">
              <Card id="demo">
                <Row>
                  <Col lg={12}>
                    <CardHeader className="border-bottom-dashed p-4">
                      <div className="d-flex">
                        <div className="flex-grow-1">
                          <img
                            src={logoDark}
                            className="card-logo card-logo-dark"
                            alt="logo dark"
                            height="17"
                          />
                          <img
                            src={logoLight}
                            className="card-logo card-logo-light"
                            alt="logo light"
                            height="17"
                          />
                          <div className="mt-sm-5 mt-4">
                            <h6 className="text-muted text-uppercase fw-semibold">
                              Address
                            </h6>
                            <p className="text-muted mb-1" id="address-details">
                              Iwalewah House 3-4 Pavilion Parade, Wood Lane,
                              London, W12 0HQ
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-sm-0 mt-3">
                          <h6>
                            <span className="text-muted fw-normal">Email:</span>{" "}
                            <span id="email">support@iwalewah.co.uk</span>
                          </h6>
                          <h6>
                            <span className="text-muted fw-normal">
                              Website:
                            </span>{" "}
                            <Link to="#" className="link-primary" id="website">
                              iwalewah.co.uk
                            </Link>
                          </h6>
                          <h6 className="mb-0">
                            <span className="text-muted fw-normal">
                              Contact No:
                            </span>{" "}
                            <span id="contact-no">07733386442</span>
                          </h6>
                        </div>
                      </div>
                    </CardHeader>
                  </Col>
                  <Col lg={12}>
                    <CardBody className="p-4">
                      <Row className="g-3">
                        <Col lg={3} xs={6}>
                          <p className="text-muted mb-2 text-uppercase fw-semibold">
                            Invoice No
                          </p>
                          <h5 className="fs-14 mb-0">
                            #{order.$id.substring(0, 8).toUpperCase()}
                          </h5>
                        </Col>
                        <Col lg={3} xs={6}>
                          <p className="text-muted mb-2 text-uppercase fw-semibold">
                            Date
                          </p>
                          <h5 className="fs-14 mb-0">
                            {new Date(order.createdAt).toLocaleDateString()}{" "}
                            <small className="text-muted">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </small>
                          </h5>
                        </Col>
                        <Col lg={3} xs={6}>
                          <p className="text-muted mb-2 text-uppercase fw-semibold">
                            Payment Status
                          </p>
                          <span className="badge bg-success-subtle text-success fs-11">
                            {order.paymentStatus || "N/A"}
                          </span>
                        </Col>
                        <Col lg={3} xs={6}>
                          <p className="text-muted mb-2 text-uppercase fw-semibold">
                            Total Amount
                          </p>
                          <h5 className="fs-14 mb-0">
                            ${totalAmount.toFixed(2)}
                          </h5>
                        </Col>
                      </Row>
                    </CardBody>
                  </Col>
                  <Col lg={12}>
                    <CardBody className="p-4 border-top border-top-dashed">
                      <Row className="g-3">
                        <Col sm={6}>
                          <h6 className="text-muted text-uppercase fw-semibold mb-3">
                            Shipping Address
                          </h6>
                          <p className="fw-medium mb-2" id="billing-name">
                            {customerName}
                          </p>
                          <p
                            className="text-muted mb-1"
                            id="billing-address-line-1"
                          >
                            {address}
                          </p>
                          <p className="text-muted mb-1">
                            <span>Phone: </span>
                            <span id="billing-phone-no">
                              {order.phoneNumber || "N/A"}
                            </span>
                          </p>
                          <p className="text-muted mb-0">
                            <span>Email: </span>
                            <span id="billing-email">{order.email || "N/A"}</span>
                          </p>
                        </Col>
                        
                      </Row>
                    </CardBody>
                  </Col>
                  <Col lg={12}>
                    <CardBody className="p-4">
                      <div className="table-responsive">
                        <Table className="table-borderless text-center table-nowrap align-middle mb-0">
                          <thead>
                            <tr className="table-active">
                              <th scope="col" style={{ width: "50px" }}>
                                #
                              </th>
                              <th scope="col">Product Details</th>
                              <th scope="col">Rate</th>
                              <th scope="col">Quantity</th>
                              <th scope="col" className="text-end">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody id="products-list">
                            {orderItems.map((item, index) => (
                              <tr key={item.$id}>
                                <th scope="row">{index + 1}</th>
                                <td className="text-start">
                                  <span className="fw-medium">
                                    {item.productName || "N/A"}
                                  </span>
                                </td>
                                <td>${item.price.toFixed(2)}</td>
                                <td>{item.quantity}</td>
                                <td className="text-end">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                      <div className="border-top border-top-dashed mt-2">
                        <Table
                          className="table table-borderless table-nowrap align-middle mb-0 ms-auto"
                          style={{ width: "250px" }}
                        >
                          <tbody>
                            <tr>
                              <td>Sub Total</td>
                              <td className="text-end">
                                ${subTotal.toFixed(2)}
                              </td>
                            </tr>
                            {/* Include discounts or additional charges if applicable */}
                            {/* <tr>
                                <td>Discount</td>
                                <td className="text-end">- $0.00</td>
                              </tr> */}
                            <tr>
                              <td>Shipping Charge</td>
                              <td className="text-end">
                                ${shippingCharge.toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-top border-top-dashed fs-15">
                              <th scope="row">Total Amount</th>
                              <th className="text-end">
                                ${totalAmount.toFixed(2)}
                              </th>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                      <div className="mt-3">
                        <h6 className="text-muted text-uppercase fw-semibold mb-3">
                          Payment Details:
                        </h6>
                        <p className="text-muted mb-1">
                          Payment Method:{" "}
                          <span className="fw-medium" id="payment-method">
                            {order.paymentMethod || "N/A"}
                          </span>
                        </p>
                        <p className="text-muted">
                          Total Amount:{" "}
                          <span className="fw-medium">
                            ${totalAmount.toFixed(2)}
                          </span>
                        </p>
                      </div>
                      <div className="mt-4">
                        <div className="alert alert-info">
                          <p className="mb-0">
                            <span className="fw-semibold">NOTES:</span>{" "}
                            <span id="note">
                              All accounts are to be paid within 7 days from
                              receipt of invoice.
                            </span>
                          </p>
                        </div>
                      </div>
                      {/* Remove the print and download buttons from here */}
                    </CardBody>
                  </Col>
                </Row>
              </Card>
            </div>
            {/* Move the buttons outside of the invoice-content div */}
            <div className="hstack gap-2 justify-content-end d-print-none mt-4">
              <Link
                to="#"
                onClick={printInvoice}
                className="btn btn-success"
              >
                <i className="ri-printer-line align-bottom me-1"></i> Print
              </Link>
              <Link to="#" onClick={downloadInvoice} className="btn btn-primary">
                <i className="ri-download-2-line align-bottom me-1"></i>{" "}
                Download
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default InvoiceDetails;
