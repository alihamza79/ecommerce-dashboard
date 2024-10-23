// src/components/Widgets.js

import React, { useState, useEffect } from 'react';
import CountUp from "react-countup";
import { Link } from 'react-router-dom';
import { Card, CardBody, Col, Row, Spinner } from 'reactstrap';
import db from '../../appwrite/Services/dbServices';
import { Query } from "appwrite";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Widgets = () => {
    // State variables for each widget
    const [totalEarnings, setTotalEarnings] = useState(null);
    const [totalOrders, setTotalOrders] = useState(null);
    const [totalCustomers, setTotalCustomers] = useState(null);
    const [myBalance, setMyBalance] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to fetch all documents with pagination
    const fetchAllDocuments = async (collection, queries = []) => {
        const limit = 100; // Maximum per request in Appwrite
        let documents = [];
        let cursor = null;
        let hasMore = true;

        while (hasMore) {
            const currentQueries = [...queries, Query.limit(limit)];
            if (cursor) {
                currentQueries.push(Query.cursorAfter(cursor));
            }

            try {
                const response = await collection.list(currentQueries);
                documents = documents.concat(response.documents);
                if (response.documents.length < limit) {
                    hasMore = false;
                } else {
                    cursor = response.documents[response.documents.length - 1].$id;
                }
            } catch (error) {
                throw error;
            }
        }

        return documents;
    };

    // Fetch data from Appwrite
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Total Earnings: Sum of totalPrice from Orders where orderStatus != "Returns"
                const earningsQuery = [
                    Query.notEqual('orderStatus', 'Returns')
                ];
                const earningsDocuments = await fetchAllDocuments(db.Orders, earningsQuery);
                const earnings = earningsDocuments.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
                setTotalEarnings(earnings);

                // 2. Total Orders: Count of Orders
                // Using a single request as Appwrite provides the total count
                const ordersResponse = await db.Orders.list([Query.limit(1)]);
                setTotalOrders(ordersResponse.total);

                // 3. Total Customers: Count of Users
                const customersResponse = await db.Users.list([Query.limit(1)]);
                setTotalCustomers(customersResponse.total);

                // 4. My Balance: Sum of totalPrice from Orders where orderStatus != "Returns" and "Pickups" and paymentStatus != "cashOnDelivery"
                const balanceQuery = [
                    Query.notEqual('orderStatus', 'Returns'),
                    Query.notEqual('orderStatus', 'Pickups'),
                    Query.notEqual('paymentStatus', 'cashOnDelivery')
                ];
                const balanceDocuments = await fetchAllDocuments(db.Orders, balanceQuery);
                const balance = balanceDocuments.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
                setMyBalance(balance);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                toast.error("Failed to fetch dashboard data.", { autoClose: 5000 });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Define widget configurations with dynamic data
    const widgets = [
        {
            id: 1,
            label: "Total Earnings",
            link: "View net earnings",
            bgcolor: "success",
            icon: "bx bx-pound",
            decimals: 2,
            prefix: "£",
            suffix: "",
            counter: totalEarnings,
            separator: ","
        },
        {
            id: 2,
            label: "Orders",
            link: "View all orders",
            bgcolor: "info",
            icon: "bx bx-shopping-bag",
            decimals: 0,
            prefix: "",
            suffix: "",
            counter: totalOrders,
            separator: ","
        },
        {
            id: 3,
            label: "Customers",
            bgcolor: "warning",
            icon: "bx bx-user-circle",
            decimals: 0,
            prefix: "",
            suffix: "",
            counter: totalCustomers,
            separator: ","
        },
        {
            id: 4,
            label: "My Balance",
            bgcolor: "primary",
            icon: "bx bx-wallet",
            decimals: 2,
            prefix: "£",
            suffix: "",
            counter: myBalance,
            separator: ","
        },
    ];

    return (
        <React.Fragment>
            <Row>
                {loading ? (
                    <Col xs="12" className="text-center">
                        <Spinner color="primary" />
                    </Col>
                ) : (
                    widgets.map((item) => (
                        <Col xl={3} md={6} key={item.id}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">{item.label}</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">
                                                    {item.counter !== null ? (
                                                        <CountUp
                                                            start={0}
                                                            prefix={item.prefix}
                                                            suffix={item.suffix}
                                                            separator={item.separator}
                                                            end={item.counter}
                                                            decimals={item.decimals}
                                                            duration={2}
                                                        />
                                                    ) : (
                                                        "0"
                                                    )}
                                                </span>
                                            </h4>
                                            <Link to="#" className="text-decoration-underline">{item.link}</Link>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className={`avatar-title rounded fs-3 bg-${item.bgcolor}-subtle`}>
                                                <i className={`text-${item.bgcolor} ${item.icon}`}></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    ))
                )}
            </Row>
            <ToastContainer closeButton={false} limit={1} />
        </React.Fragment>
    );

};

export default Widgets;
