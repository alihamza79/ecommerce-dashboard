// src/components/WidgetsOrders.js

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Col, Row } from 'reactstrap';
import CountUp from 'react-countup';

const WidgetsOrders = ({ totalEarnings, totalOrders, totalCustomers, myBalance }) => {
  const widgets = [
    {
      id: 1,
      label: "Total Earnings",
      link: "Total net earnings",
      bgcolor: "success",
      icon: "bx bx-pound",
      decimals: 2,
      prefix: "£",
      suffix: "",
      counter: totalEarnings,
      separator: ",",
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
      separator: ",",
    },
    {
      id: 3,
      label: "Customers",
      link: "Total Users",
      bgcolor: "warning",
      icon: "bx bx-user-circle",
      decimals: 0,
      prefix: "",
      suffix: "",
      counter: totalCustomers,
      separator: ",",
    },
    {
      id: 4,
      label: "My Balance",
      link: "Online Payment Balence",
      bgcolor: "primary",
      icon: "bx bx-wallet",
      decimals: 2,
      prefix: "£",
      suffix: "",
      counter: myBalance,
      separator: ",",
    },
  ];

  return (
    <Row>
      {widgets.map((item) => (
        <Col xl={3} md={6} key={item.id}>
          <Card className="card-animate">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                    {item.label}
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                    <span className="counter-value">
                      <CountUp
                        start={0}
                        prefix={item.prefix}
                        suffix={item.suffix}
                        separator={item.separator}
                        end={item.counter || 0}
                        decimals={item.decimals}
                        duration={2}
                      />
                    </span>
                  </h4>
                  <Link to="#" className="text-decoration-underline">
                    {item.link}
                  </Link>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span
                    className={`avatar-title rounded fs-3 bg-${item.bgcolor}-subtle`}
                  >
                    <i className={`text-${item.bgcolor} ${item.icon}`}></i>
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default WidgetsOrders;
