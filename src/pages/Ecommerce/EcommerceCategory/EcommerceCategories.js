// src/pages/Ecommerce/EcommerceCategories.js

import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  CardBody,
  CardHeader,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { Link } from "react-router-dom";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";
import db from "../../../appwrite/Services/dbServices";
import storageServices from "../../../appwrite/Services/storageServices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Query } from "appwrite";

const EcommerceCategories = () => {
  const [categoryList, setCategoryList] = useState([]);
  const [filteredCategoryList, setFilteredCategoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [dele, setDele] = useState(0); // Count of selected categories for bulk delete

  // Fetch categories from Appwrite on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true); // Set loading to true when fetching starts
        const response = await db.Categories.list();
        const categories = response.documents.map((category) => ({
          ...category,
        }));
        setCategoryList(categories);
        setFilteredCategoryList(categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to fetch categories");
      } finally {
        setIsLoading(false); // Set loading to false when fetching is done
      }
    };

    fetchCategories();
  }, []);

  // Function to open the single delete modal
  const onClickDelete = (category) => {
    setCategoryToDelete(category);
    setDeleteModal(true);
  };

  // Function to delete associated products and their images
  const deleteProductsByCategory = async (categoryId) => {
    try {
      const productsResponse = await db.Products.list([
        Query.equal("categoryId", categoryId),
      ]);
      const products = productsResponse.documents;

      // Delete each product's images and the product itself
      await Promise.all(
        products.map(async (product) => {
          // Delete associated product images
          if (product.images && product.images.length > 0) {
            await Promise.all(
              product.images.map(async (imageId) => {
                await storageServices.images.deleteFile(imageId);
              })
            );
          }
          // Delete the product
          await db.Products.delete(product.$id);
        })
      );
    } catch (error) {
      console.error("Failed to delete products:", error);
      throw new Error("Failed to delete associated products");
    }
  };

  // Function to handle deletion of a single category and its products
  const handleDeleteCategory = async () => {
    if (categoryToDelete) {
      try {
        // Delete associated products and their images first
        await deleteProductsByCategory(categoryToDelete.$id);

        // Delete associated category image if it exists
        if (categoryToDelete.image) {
          await storageServices.images.deleteFile(categoryToDelete.image);
        }

        // Delete the category document
        await db.Categories.delete(categoryToDelete.$id);
        setDeleteModal(false);

        // Update the state using functional updates
        setCategoryList((prevList) =>
          prevList.filter((c) => c.$id !== categoryToDelete.$id)
        );
        setFilteredCategoryList((prevList) =>
          prevList.filter((c) => c.$id !== categoryToDelete.$id)
        );

        toast.success(
          "Category and associated products deleted successfully"
        );
      } catch (error) {
        console.error("Failed to delete category:", error);
        toast.error(error.message || "Failed to delete category");
      }
    }
  };

  // Function to display or hide the bulk delete option based on selection
  const displayDelete = () => {
    const ele = document.querySelectorAll(".categoryCheckBox:checked");
    const del = document.getElementById("selection-element");
    setDele(ele.length);
    if (ele.length === 0) {
      del.style.display = "none";
    } else {
      del.style.display = "block";
    }
  };

  // Function to handle deletion of multiple categories and their products
  const deleteMultiple = async () => {
    const ele = document.querySelectorAll(".categoryCheckBox:checked");
    const del = document.getElementById("selection-element");
    try {
      await Promise.all(
        Array.from(ele).map(async (element) => {
          const categoryId = element.value;
          const category = categoryList.find((c) => c.$id === categoryId);

          // Delete associated products and their images
          await deleteProductsByCategory(categoryId);

          // Delete associated category image if it exists
          if (category.image) {
            await storageServices.images.deleteFile(category.image);
          }

          // Delete the category
          await db.Categories.delete(categoryId);
        })
      );
      // Remove the deleted categories from the state
      const deletedIds = Array.from(ele).map((element) => element.value);
      setCategoryList((prevList) =>
        prevList.filter((c) => !deletedIds.includes(c.$id))
      );
      setFilteredCategoryList((prevList) =>
        prevList.filter((c) => !deletedIds.includes(c.$id))
      );
      del.style.display = "none";
      setDele(0);
      setDeleteModalMulti(false);

      toast.success(
        "Selected categories and associated products deleted successfully"
      );
    } catch (error) {
      console.error("Failed to delete categories:", error);
      toast.error(error.message || "Failed to delete selected categories");
    }
  };

  // Function to get image URL
  const getImageURL = (imageId) => {
    return storageServices.images.getFilePreview(imageId);
  };

  // Define table columns using useMemo for performance optimization
  const columns = useMemo(
    () => [
      {
        header: "#",
        accessorKey: "$id",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell) => {
          return (
            <input
              type="checkbox"
              className="categoryCheckBox form-check-input"
              value={cell.getValue()}
              onClick={() => displayDelete()}
            />
          );
        },
      },
      {
        header: "Image",
        accessorKey: "image",
        enableColumnFilter: false,
        cell: (cell) => {
          const imageId = cell.getValue();
          return imageId ? (
            <img
              src={getImageURL(imageId)}
              alt={cell.row.original.name}
              style={{
                width: "50px",
                height: "50px",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
          ) : (
            <img
              src="/path/to/default-category-image.jpg" // Provide a default image path
              alt="Default"
              style={{
                width: "50px",
                height: "50px",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
          );
        },
      },
      {
        header: "Category Name",
        accessorKey: "name",
        enableColumnFilter: false,
        cell: (cell) => (
          <Link
            to={`/apps-ecommerce-edit-category/${cell.row.original.$id}`}
            className="text-body"
          >
            {cell.getValue()}
          </Link>
        ),
      },
      {
        header: "Description",
        accessorKey: "description",
        enableColumnFilter: false,
        cell: (cell) => (
          <span>
            {cell.getValue() ? cell.getValue() : "No description."}
          </span>
        ),
      },
      {
        header: "Action",
        cell: (cell) => {
          return (
            <UncontrolledDropdown>
              <DropdownToggle
                href="#"
                className="btn btn-soft-secondary btn-sm"
                tag="button"
              >
                <i className="ri-more-fill" />
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu-end">
                {/* Edit Category */}
                <DropdownItem
                  tag={Link}
                  to={`/apps-ecommerce-edit-category/${cell.row.original.$id}`}
                >
                  <i className="ri-pencil-fill align-bottom me-2 text-muted"></i>{" "}
                  Edit
                </DropdownItem>

                {/* Delete Category */}
                <DropdownItem
                  href="#"
                  onClick={() => {
                    const categoryData = cell.row.original;
                    onClickDelete(categoryData);
                  }}
                >
                  <i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i>{" "}
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          );
        },
      },
    ],
    [categoryList]
  );

  return (
    <div className="page-content">
      {/* Toast notifications */}
      <ToastContainer closeButton={false} limit={1} />

      {/* Single Delete Modal */}
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteCategory}
        onCloseClick={() => setDeleteModal(false)}
        title="Delete Category"
        requireConfirmation="true"
        message="Are you sure you want to delete this category and all its associated products? This action cannot be undone."
      />

      {/* Bulk Delete Modal */}
      <DeleteModal
        show={deleteModalMulti}
        onDeleteClick={deleteMultiple}
        onCloseClick={() => setDeleteModalMulti(false)}
        title="Delete Selected Categories"
        requireConfirmation="true"
        message="Are you sure you want to delete the selected categories and all their associated products? This action cannot be undone."
      />

      <Container fluid>
        {/* Breadcrumb for navigation */}
        <BreadCrumb title="Categories" pageTitle="Ecommerce" />

        {/* Add Category Button */}
        <Row className="mb-3">
          <Col>
            <Button color="success" tag={Link} to="/apps-ecommerce-add-category">
              <i className="ri-add-line align-bottom me-1"></i> Add Category
            </Button>
          </Col>
        </Row>

        {/* Categories Table */}
        <Row>
          <Col xl={12}>
            <Card>
              <CardHeader>
                <Row className="align-items-center">
                  <Col>
                    <h5 className="card-title mb-0">Categories</h5>
                  </Col>
                  <div className="col-auto">
                    {/* Bulk Delete Indicator */}
                    <div id="selection-element" style={{ display: "none" }}>
                      <div className="my-n1 d-flex align-items-center text-muted">
                        Selected{" "}
                        <div
                          id="select-content"
                          className="text-body fw-semibold px-1"
                        >
                          {dele}
                        </div>{" "}
                        Result(s)
                        <Button
                          color="link"
                          className="link-danger p-0 ms-3"
                          onClick={() => setDeleteModalMulti(true)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </Row>
              </CardHeader>
              <CardBody>
                {isLoading ? (
                  // Loading Indicator
                  <div className="py-4 text-center">
                    <div>
                      <lord-icon
                        src="https://cdn.lordicon.com/msoeawqm.json"
                        trigger="loop"
                        colors="primary:#405189,secondary:#0ab39c"
                        style={{ width: "72px", height: "72px" }}
                      ></lord-icon>
                    </div>

                    <div className="mt-4">
                      <h5>Loading data!</h5>
                    </div>
                  </div>
                ) : filteredCategoryList && filteredCategoryList.length > 0 ? (
                  <TableContainer
                    columns={columns}
                    data={filteredCategoryList}
                    isGlobalFilter={true}
                    isAddUserList={false}
                    customPageSize={10}
                    divClass="table-responsive mb-1"
                    tableClass="mb-0 align-middle table-borderless"
                    theadClass="table-light text-muted"
                    SearchPlaceholder="Search Categories..."
                  />
                ) : (
                  <div className="py-4 text-center">
                    <lord-icon
                      src="https://cdn.lordicon.com/msoeawqm.json"
                      trigger="loop"
                      colors="primary:#405189,secondary:#0ab39c"
                      style={{ width: "72px", height: "72px" }}
                    ></lord-icon>
                    <div className="mt-4">
                      <h5>Sorry! No Categories Found</h5>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EcommerceCategories;
