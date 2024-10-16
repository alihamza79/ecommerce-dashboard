// src/components/StoreVisits.js

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  Col,
  Spinner,
} from "reactstrap";
import { StoreVisitsCharts } from "./DashboardEcommerceCharts";
import db from "../../appwrite/Services/dbServices";
import { Query } from "appwrite";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StoreVisits = () => {
  const [labels, setLabels] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch and process data
  const fetchTopCategories = async () => {
    setLoading(true);
    try {
      // Fetch all OrderItems
      const orderItemsResponse = await db.OrderItems.list([
        Query.limit(1000), // Adjust the limit as needed
      ]);
      const orderItems = orderItemsResponse.documents;

      // Aggregate the number of items sold per category
      const categorySalesMap = {};
      orderItems.forEach((item) => {
        const categoryId = item.categoryId;
        const quantity = item.quantity || 1; // Default to 1 if quantity is undefined
        if (categorySalesMap[categoryId]) {
          categorySalesMap[categoryId] += quantity;
        } else {
          categorySalesMap[categoryId] = quantity;
        }
      });

      // Fetch all Categories to map categoryId to categoryName
      const categoriesResponse = await db.Categories.list([
        Query.limit(1000), // Adjust the limit as needed
      ]);
      const categories = categoriesResponse.documents;

      // Create a map of categoryId to categoryName
      const categoryIdNameMap = {};
      categories.forEach((category) => {
        categoryIdNameMap[category.$id] = category.name;
      });

      // Convert the categorySalesMap to an array for sorting
      const salesArray = Object.entries(categorySalesMap).map(
        ([categoryId, sales]) => ({
          categoryId,
          categoryName: categoryIdNameMap[categoryId] || "Unknown",
          sales,
        })
      );

      // Sort the categories by sales in descending order
      salesArray.sort((a, b) => b.sales - a.sales);

      // Determine top 4 categories
      const topCategories = salesArray.slice(0, 4);
      const restCategories = salesArray.slice(4);

      // Calculate the total sales for the "Rest" category
      const restSales = restCategories.reduce((acc, curr) => acc + curr.sales, 0);

      // Prepare labels and series
      const chartLabels = topCategories.map((cat) => cat.categoryName);
      const chartSeries = topCategories.map((cat) => cat.sales);

      if (restSales > 0) {
        chartLabels.push("Rest");
        chartSeries.push(restSales);
      }

      setLabels(chartLabels);
      setSeries(chartSeries);
    } catch (error) {
      console.error("Error fetching top categories:", error);
      toast.error("Failed to fetch top categories data.", { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchTopCategories();
  }, []);

  return (
    <React.Fragment>
      <Col xl={4}>
        <Card className="card-height-100">
          <CardHeader className="align-items-center d-flex">
            <h4 className="card-title mb-0 flex-grow-1">Top Categories</h4>
            <div className="flex-shrink-0">
              {/* Removed UncontrolledDropdown for simplicity */}
            </div>
          </CardHeader>

          <div className="card-body d-flex align-items-center justify-content-center">
            {loading ? (
              <div className="text-center">
                <Spinner color="primary" />
                <span className="ms-2">Loading...</span>
              </div>
            ) : labels.length > 0 ? (
              <StoreVisitsCharts
                dataColors='["--vz-primary", "--vz-success", "--vz-warning", "--vz-danger", "--vz-info"]'
                series={series}
                labels={labels}
              />
            ) : (
              <div className="text-center">
                <p className="text-muted">No data available.</p>
              </div>
            )}
          </div>
        </Card>
      </Col>
      <ToastContainer closeButton={false} limit={1} />
    </React.Fragment>
  );
};

export default StoreVisits;
