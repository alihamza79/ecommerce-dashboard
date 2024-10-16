import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Spinner,
  Button,
} from "reactstrap";
import db from "../../appwrite/Services/dbServices";
import { Query } from "appwrite";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";
import TableContainer from "../../Components/Common/TableContainer"; // Ensure correct import path

const RecentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getOrderNumber = (orderId) => {
    return `#${orderId.substring(0, 8).toUpperCase()}`;
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "inprogress":
        return "secondary";
      case "pickups":
        return "info";
      case "returns":
        return "primary";
      case "delivered":
        return "success";
      default:
        return "secondary";
    }
  };

  const fetchRecentOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ordersResponse = await db.Orders.list([
        Query.orderDesc("createdAt"),
        Query.limit(5),
      ]);
      const fetchedOrders = ordersResponse.documents;
      setOrders(fetchedOrders);

      if (fetchedOrders.length === 0) {
        setUsersMap({});
        setLoading(false);
        return;
      }

      const userIds = [...new Set(fetchedOrders.map((order) => order.userId))];

      const usersResponse = await db.Users.list([
        ...userIds.map((id) => Query.equal("$id", id)),
      ]);
      const fetchedUsers = usersResponse.documents;

      const userMap = {};
      fetchedUsers.forEach((user) => {
        userMap[user.$id] = user;
      });
      setUsersMap(userMap);
    } catch (err) {
      console.error("Error fetching recent orders:", err);
      const errorMessage =
        (err.response &&
          err.response.data &&
          err.response.data.message) ||
        err.message ||
        "Failed to fetch recent orders.";
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  const columns = useMemo(
    () => [
      {
        header: "Order ID",
        accessorKey: "$id",
        cell: (cell) => (
          <Link
            to={`/apps-ecommerce-order-details/${cell.getValue()}`}
            className="fw-medium link-primary"
          >
            {getOrderNumber(cell.getValue())}
          </Link>
        ),
        minWidth: "120px", // Set a minimum width
      },
    //   {
    //     header: "Customer",
    //     accessorKey: "userId",
    //     cell: (cell) => usersMap[cell.getValue()]?.name || "N/A",
    //     minWidth: "150px", // Set a minimum width
    //   },
      {
        header: "Order Date",
        accessorKey: "createdAt",
        cell: (cell) =>
          moment(cell.getValue()).format("DD MMM YYYY, hh:mm A"),
        minWidth: "180px", // Set a minimum width
      },
      {
        header: "Amount",
        accessorKey: "totalPrice",
        cell: (cell) => `$${parseFloat(cell.getValue()).toFixed(2)}`,
        minWidth: "100px", // Set a minimum width
      },
      {
        header: "Payment Method",
        accessorKey: "paymentMethod",
        cell: (cell) => cell.getValue(),
        minWidth: "150px", // Set a minimum width
      },
      {
        header: "Delivery Status",
        accessorKey: "orderStatus",
        cell: (cell) => {
          const status = cell.getValue();
          const statusClass = getStatusClass(status);
          return (
            <span className={`badge bg-${statusClass}-subtle text-${statusClass}`}>
              {status}
            </span>
          );
        },
        minWidth: "150px", // Set a minimum width
      },
    ],
    [usersMap]
  );

  return (
    <React.Fragment>
      <Col xl={12}>
        <Card>
          <CardHeader className="align-items-center d-flex">
            <h4 className="card-title mb-0 flex-grow-1">Recent Orders</h4>
            
          </CardHeader>

          <CardBody>
            <div className="table-responsive">
              {loading && (
                <div className="text-center my-4">
                  <Spinner color="primary" />
                  <span className="ms-2">Loading...</span>
                </div>
              )}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              {!loading && !error && orders.length === 0 && (
                <div className="alert alert-info" role="alert">
                  No recent orders.
                </div>
              )}
              {!loading && !error && orders.length > 0 && (
                <TableContainer
                  columns={columns}
                  data={orders}
                  isGlobalFilter={false}
                  customPageSize={5}
                  divClass="table-responsive"
                  tableClass="table table-nowrap table-borderless align-middle"
                  theadClass="table-light text-muted"
                  handleOrderClick={() => {}}
                  isOrderFilter={false}
                  SearchPlaceholder="Search..."
                />
              )}
            </div>
          </CardBody>
        </Card>
      </Col>

      <ToastContainer closeButton={false} limit={1} />
    </React.Fragment>
  );
};

export default RecentOrders;
