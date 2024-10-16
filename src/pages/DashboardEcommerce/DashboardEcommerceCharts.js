// src/components/DashboardEcommerceCharts.js

import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../Components/Common/ChartsDynamicColor";

const RevenueCharts = ({ dataColors, series, categories }) => {
  const linechartcustomerColors = getChartColorsArray(dataColors);

  const options = {
    chart: {
      height: 370,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      dashArray: [0, 0, 8],
      width: [2, 0, 2.2],
    },
    fill: {
      opacity: [0.1, 0.9, 1],
    },
    markers: {
      size: [0, 0, 0],
      strokeWidth: 2,
      hover: {
        size: 4,
      },
    },
    xaxis: {
      categories: categories, // Dynamic categories
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
    },
    grid: {
      show: true,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
      padding: {
        top: 0,
        right: -2,
        bottom: 15,
        left: 10,
      },
    },
    legend: {
      show: true,
      horizontalAlign: "center",
      offsetX: 0,
      offsetY: -5,
      markers: {
        width: 9,
        height: 9,
        radius: 6,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 0,
      },
    },
    plotOptions: {
      bar: {
        columnWidth: "30%",
        barHeight: "70%",
      },
    },
    colors: linechartcustomerColors,
    tooltip: {
      shared: true,
      y: [
        {
          formatter: function (y) {
            if (typeof y !== "undefined") {
              return y.toFixed(0);
            }
            return y;
          },
        },
        {
          formatter: function (y) {
            if (typeof y !== "undefined") {
              return "£" + y.toFixed(2);
            }
            return y;
          },
        },
        {
          formatter: function (y) {
            if (typeof y !== "undefined") {
              return y.toFixed(0) + " Orders";
            }
            return y;
          },
        },
      ],
    },
  };

  return (
    <React.Fragment>
      <ReactApexChart
        dir="ltr"
        options={options}
        series={series}
        type="line"
        height="370"
        className="apex-charts"
      />
    </React.Fragment>
  );
};

// src/components/DashboardEcommerceCharts.js

// src/components/DashboardEcommerceCharts.js



const StoreVisitsCharts = ({ dataColors, series, labels }) => {
  const chartColors = getChartColorsArray(dataColors);

  const options = {
    labels: labels, // Dynamic labels passed as a prop
    chart: {
      height: 333,
      type: "donut",
    },
    legend: {
      position: "bottom",
    },
    stroke: {
      show: false,
    },
    dataLabels: {
      dropShadow: {
        enabled: false,
      },
    },
    colors: chartColors,
    tooltip: {
      y: {
        formatter: function (val, { series, seriesIndex, dataPointIndex, w }) {
          // Check if 'w' and 'w.globals.seriesPercent' exist
          if (
            w &&
            w.globals &&
            w.globals.seriesPercent &&
            w.globals.seriesPercent[seriesIndex] !== undefined
          ) {
            const percent = w.globals.seriesPercent[seriesIndex];
            return `${val} Sales (${percent.toFixed(2)}%)`;
          }
          return `${val} Sales`;
        },
      },
    },
  };

  return (
    <React.Fragment>
      <ReactApexChart
        dir="ltr"
        options={options}
        series={series}
        type="donut"
        height="333"
        className="apex-charts"
      />
    </React.Fragment>
  );
};


export { RevenueCharts, StoreVisitsCharts };
