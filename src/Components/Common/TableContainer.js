// src/Components/Common/TableContainer.jsx

import React, { Fragment, useEffect, useState } from "react";
import { CardBody, Col, Row, Table } from "reactstrap";
import { Link } from "react-router-dom";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

// Global Filter Component
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [debounce, onChange, value]);

  return (
    <input
      {...props}
      value={value}
      id="search-bar-0"
      className="form-control search"
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

// Define the 'fuzzy' filter function
const fuzzyFilter = (row, columnIds, filterValue, filterFields) => {
  if (!filterValue) return true;
  const searchTerm = filterValue.toLowerCase();

  // If filterFields is not provided or empty, don't filter
  if (!filterFields || filterFields.length === 0) {
    return true;
  }

  // Iterate over the specified filter fields
  return filterFields.some((field) => {
    const value = row.getValue(field);
    if (typeof value === "string" || typeof value === "number") {
      return String(value).toLowerCase().includes(searchTerm);
    }
    return false;
  });
};

const TableContainer = ({
  columns,
  data,
  isGlobalFilter,
  isFilter,
  customPageSize,
  tableClass,
  theadClass,
  trClass,
  thClass,
  divClass,
  SearchPlaceholder,
  globalFilterFn, // Expected to be a string that maps to a filter function
  filterFields = [], // Array of field names to search on
}) => {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    columns,
    data,
    filterFns: {
      fuzzy: (row, columnIds, filterValue) =>
        fuzzyFilter(row, columnIds, filterValue, filterFields), // Pass filterFields to fuzzyFilter
      // Add other filter functions here if needed
    },
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn, // Should match a key in filterFns
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const {
    getHeaderGroups,
    getCanPreviousPage,
    getCanNextPage,
    setPageIndex,
    nextPage,
    previousPage,
    setPageSize,
    getState,
  } = table;

  useEffect(() => {
    if (customPageSize) {
      setPageSize(customPageSize);
    }
  }, [customPageSize, setPageSize]);

  const pageCount = table.getPageCount();
  const currentPageIndex = getState().pagination.pageIndex;
  const maxPageNumbers = 7; // Adjust this number as needed

  const getPageNumbers = (currentPageIndex, pageCount, maxPageNumbers) => {
    const pages = [];

    if (pageCount <= maxPageNumbers) {
      // Less than max, show all pages
      for (let i = 0; i < pageCount; i++) {
        pages.push(i);
      }
    } else {
      // More than max, show first, last, and middle pages
      const sideWidth = Math.max(1, Math.floor((maxPageNumbers - 3) / 2));
      let left = currentPageIndex - sideWidth;
      let right = currentPageIndex + sideWidth;

      if (left < 1) {
        right += 1 - left;
        left = 1;
      }
      if (right > pageCount - 2) {
        left -= right - (pageCount - 2);
        right = pageCount - 2;
      }

      pages.push(0); // First page

      if (left > 1) {
        pages.push("ellipsis");
      }

      for (let i = left; i <= right; i++) {
        pages.push(i);
      }

      if (right < pageCount - 2) {
        pages.push("ellipsis");
      }

      pages.push(pageCount - 1); // Last page
    }

    return pages;
  };

  const pageNumbers = getPageNumbers(currentPageIndex, pageCount, maxPageNumbers);

  return (
    <Fragment>
      {isGlobalFilter && (
        <Row className="mb-3">
          <CardBody className="border border-dashed border-end-0 border-start-0">
            {/* Replace form with a div to prevent page reload on Enter key */}
            <div>
              <Row>
                <Col sm={5}>
                  <div className="search-box me-2 mb-2 d-inline-block col-12">
                    <DebouncedInput
                      value={globalFilter ?? ""}
                      onChange={(value) => setGlobalFilter(value)}
                      placeholder={SearchPlaceholder}
                    />
                    <i className="bx bx-search-alt search-icon"></i>
                  </div>
                </Col>
              </Row>
            </div>
          </CardBody>
        </Row>
      )}

      <div className={divClass}>
        <Table hover className={tableClass}>
          <thead className={theadClass}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr className={trClass} key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={thClass}
                    {...{
                      onClick: header.column.getToggleSortingHandler(),
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <React.Fragment>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted()] ?? null}
                        {isFilter && header.column.getCanFilter() ? (
                          <div>
                            {/* If you have a Filter component, you can render it here */}
                          </div>
                        ) : null}
                      </React.Fragment>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
        <div className="col-sm">
          <div className="text-muted">
            Showing
            <span className="fw-semibold ms-1">
              {data.length > 0
                ? currentPageIndex * getState().pagination.pageSize + 1
                : 0}
            </span>
            to
            <span className="fw-semibold ms-1">
              {Math.min(
                (currentPageIndex + 1) * getState().pagination.pageSize,
                data.length
              )}
            </span>
            of
            <span className="fw-semibold"> {data.length}</span> Results
          </div>
        </div>
        <div className="col-sm-auto">
          <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
            <li
              className={
                !getCanPreviousPage() ? "page-item disabled" : "page-item"
              }
            >
              <Link
                to="#"
                className="page-link"
                onClick={() => previousPage()}
              >
                Previous
              </Link>
            </li>
            {pageNumbers.map((item, key) => {
              if (item === "ellipsis") {
                return (
                  <li key={key} className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                );
              } else {
                return (
                  <li key={key} className="page-item">
                    <Link
                      to="#"
                      className={
                        currentPageIndex === item
                          ? "page-link active"
                          : "page-link"
                      }
                      onClick={() => setPageIndex(item)}
                    >
                      {item + 1}
                    </Link>
                  </li>
                );
              }
            })}
            <li
              className={
                !getCanNextPage() ? "page-item disabled" : "page-item"
              }
            >
              <Link
                to="#"
                className="page-link"
                onClick={() => nextPage()}
              >
                Next
              </Link>
            </li>
          </ul>
        </div>
      </Row>
    </Fragment>
  );
};

export default TableContainer;
