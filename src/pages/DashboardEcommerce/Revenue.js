// src/components/Revenue.js

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Col, Row, Button, Spinner } from "reactstrap";
import { RevenueCharts } from "./DashboardEcommerceCharts";
import db from "../../appwrite/Services/dbServices";
import { Query } from "appwrite";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";

const Revenue = () => {
  const [chartData, setChartData] = useState([]);
  const [categories, setCategories] = useState([]); // State for dynamic month labels
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [summary, setSummary] = useState({
    orders: 0,
    earnings: 0,
    refunds: 0,
    conversationRatio: 0,
  });
  const [loading, setLoading] = useState(true);

  // Helper function to get start date based on period
  const getStartDate = (period) => {
    const now = moment();
    switch (period) {
      case "month":
        return now.clone().subtract(1, "months").startOf("month");
      case "halfyear":
        return now.clone().subtract(6, "months").startOf("month");
      case "year":
        return now.clone().subtract(12, "months").startOf("month");
      case "all":
      default:
        return now.clone().subtract(11, "months").startOf("month"); // Last 12 months including current
    }
  };

  // Fetch and process data from Appwrite
  const fetchRevenueData = async (period) => {
    setLoading(true);
    try {
      const startDate = getStartDate(period).toDate();
      const endDate = moment().endOf("month").toDate();

      // Fetch Orders within the date range
      const ordersQuery = [
        Query.greaterThanEqual("createdAt", startDate),
        Query.lessThanEqual("createdAt", endDate),
      ];
      const ordersResponse = await db.Orders.list(ordersQuery);
      const orders = ordersResponse.documents;

      // Initialize data structures
      const months = [];
      const ordersPerMonth = {};
      const earningsPerMonth = {};
      const refundsPerMonth = {};

      // Determine the number of months based on the selected period
      let totalMonths;
      switch (period) {
        case "month":
          totalMonths = 1;
          break;
        case "halfyear":
          totalMonths = 6;
          break;
        case "year":
        case "all":
        default:
          totalMonths = 12;
          break;
      }

      // Generate month labels and initialize aggregation objects
      for (let i = totalMonths - 1; i >= 0; i--) {
        const monthMoment = moment(endDate).subtract(i, "months");
        const month = monthMoment.format("MMM"); // e.g., "Jan", "Feb"
        months.push(month);
        ordersPerMonth[month] = 0;
        earningsPerMonth[month] = 0;
        refundsPerMonth[month] = 0;
      }

      // Aggregate data
      orders.forEach((order) => {
        const orderMonth = moment(order.createdAt).format("MMM");
        if (ordersPerMonth.hasOwnProperty(orderMonth)) {
          ordersPerMonth[orderMonth] += 1;
          earningsPerMonth[orderMonth] += order.totalPrice || 0;
          if (order.orderStatus === "Returns") {
            refundsPerMonth[orderMonth] += 1;
          }
        }
      });

      // Prepare series data
      const ordersSeries = {
        name: "Orders",
        type: "area",
        data: months.map((month) => ordersPerMonth[month]),
      };

      const earningsSeries = {
        name: "Earnings",
        type: "bar",
        data: months.map((month) => parseFloat(earningsPerMonth[month].toFixed(2))),
      };

      const refundsSeries = {
        name: "Refunds",
        type: "line",
        data: months.map((month) => refundsPerMonth[month]),
      };

      setChartData([ordersSeries, earningsSeries, refundsSeries]);
      setCategories(months); // Update categories state with month names

      // Update summary
      const totalOrders = orders.length;
      const totalEarnings = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
      const totalRefunds = orders.filter((order) => order.orderStatus === "Returns").length;
      const conversationRatio = totalOrders
        ? ((totalOrders - totalRefunds) / totalOrders) * 100
        : 0;

      setSummary({
        orders: totalOrders,
        earnings: totalEarnings,
        refunds: totalRefunds,
        conversationRatio: parseFloat(conversationRatio.toFixed(2)),
      });
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      toast.error("Failed to fetch revenue data.", { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // Handle period change
  const onChangeChartPeriod = (pType) => {
    setSelectedPeriod(pType);
  };

  // Fetch data on component mount and when period changes
  useEffect(() => {
    fetchRevenueData(selectedPeriod);
  }, [selectedPeriod]);

  return (
    <React.Fragment>
      <Card>
        <CardHeader className="border-0 align-items-center d-flex">
          <h4 className="card-title mb-0 flex-grow-1">Revenue</h4>
          <div className="d-flex gap-1">
            <Button
              type="button"
              color="soft-secondary"
              size="sm"
              onClick={() => onChangeChartPeriod("all")}
              active={selectedPeriod === "all"}
            >
              ALL
            </Button>
            <Button
              type="button"
              color="soft-secondary"
              size="sm"
              onClick={() => onChangeChartPeriod("month")}
              active={selectedPeriod === "month"}
            >
              1M
            </Button>
            <Button
              type="button"
              color="soft-secondary"
              size="sm"
              onClick={() => onChangeChartPeriod("halfyear")}
              active={selectedPeriod === "halfyear"}
            >
              6M
            </Button>
            <Button
              type="button"
              color="soft-primary"
              size="sm"
              onClick={() => onChangeChartPeriod("year")}
              active={selectedPeriod === "year"}
            >
              1Y
            </Button>
          </div>
        </CardHeader>

        <CardHeader className="p-0 border-0 bg-light-subtle">
          <Row className="g-0 text-center">
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1">
                  {summary.orders}
                </h5>
                <p className="text-muted mb-0">Orders</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1">
                  £{summary.earnings.toFixed(2)}
                </h5>
                <p className="text-muted mb-0">Earnings</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1">
                  {summary.refunds}
                </h5>
                <p className="text-muted mb-0">Refunds</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0 border-end-0">
                <h5 className="mb-1 text-success">
                  {summary.conversationRatio}%
                </h5>
                <p className="text-muted mb-0">Conversation Ratio</p>
              </div>
            </Col>
          </Row>
        </CardHeader>

        <CardBody className="p-0 pb-2">
          <div className="w-100">
            <div dir="ltr">
              {!loading ? (
                <RevenueCharts
                  series={chartData}
                  categories={categories} // Pass dynamic month names
                  dataColors='["--vz-primary", "--vz-success", "--vz-danger"]'
                />
              ) : (
                <div className="text-center my-4">
                  <Spinner color="primary" />
                  <span className="ms-2">Loading...</span>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
      <ToastContainer closeButton={false} limit={1} />
    </React.Fragment>
  );
};

export default Revenue;
