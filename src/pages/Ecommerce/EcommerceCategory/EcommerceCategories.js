// src/pages/Ecommerce/EcommerceCategories.jsx

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
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const limit = 25; // Set the limit for pagination

  // Helper function to safely delete a file with enhanced error handling
  const safeDeleteFile = async (imageId) => {
    try {
      await storageServices.images.deleteFile(imageId);
    } catch (error) {
      if (error.code === "storage_file_not_found") {
        console.warn(`Image with ID ${imageId} not found. Skipping deletion.`);
      } else {
        console.error(`Error deleting image ${imageId}:`, error);
        throw error; // Re-throw other unexpected errors
      }
    }
  };

  // Helper function to recursively get all descendant category IDs
  const getAllDescendantCategoryIds = (parentId, categories) => {
    let ids = [];
    const directSubs = categories.filter((cat) => cat.parentCategoryId === parentId);
    directSubs.forEach((sub) => {
      ids.push(sub.$id);
      ids = ids.concat(getAllDescendantCategoryIds(sub.$id, categories));
    });
    return ids;
  };

  // Helper function to fetch all products for given category IDs
  const fetchProductsByCategoryIds = async (categoryIds) => {
    const allProducts = [];
    let offset = 0;
    const limit = 100; // Adjust as needed

    try {
      while (true) {
        const response = await db.Products.list([
          Query.limit(limit),
          Query.offset(offset),
          Query.equal("categoryId", categoryIds),
        ]);
        allProducts.push(...response.documents);
        if (response.documents.length < limit) break;
        offset += limit;
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }

    return allProducts;
  };

  // Function to fetch all categories with pagination
  const fetchAllCategories = async () => {
    let allCategories = [];
    let offset = 0;
    let fetchedCategories = [];

    try {
      setIsLoading(true);
      do {
        // Fetch categories with pagination using Query.limit() and Query.offset()
        const response = await db.Categories.list([
          Query.limit(limit),
          Query.offset(offset),
        ]);
        fetchedCategories = response.documents;
        allCategories = [...allCategories, ...fetchedCategories];
        offset += limit; // Increment the offset for the next batch
      } while (fetchedCategories.length === limit); // Continue until we get less than the limit

      // Set all categories to state
      setCategoryList(allCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    fetchAllCategories();
  }, []);

  // Function to delete category with cascading deletion
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) {
      toast.error("No category selected for deletion.");
      return;
    }

    try {
      setIsLoading(true);

      // 1. Collect all descendant category IDs
      const descendantCategoryIds = getAllDescendantCategoryIds(
        categoryToDelete.$id,
        categoryList
      );
      const allCategoryIdsToDelete = [categoryToDelete.$id, ...descendantCategoryIds];

      // 2. Fetch all products associated with these categories
      const productsToDelete = await fetchProductsByCategoryIds(allCategoryIdsToDelete);

      // 3. Delete product images and products in parallel
      const deleteProductsPromises = productsToDelete.map(async (product) => {
        // Delete product images
        if (product.images && product.images.length > 0) {
          const deleteImagesPromises = product.images.map((imageId) => safeDeleteFile(imageId));
          await Promise.all(deleteImagesPromises);
        }
        // Delete the product
        await db.Products.delete(product.$id);
      });

      await Promise.all(deleteProductsPromises);

      // 4. Separate subcategories from the main category
      const subcategories = categoryList.filter(
        (cat) =>
          allCategoryIdsToDelete.includes(cat.$id) && cat.$id !== categoryToDelete.$id
      );

      // 5. Delete subcategories' images and subcategories in parallel
      const deleteSubcategoriesPromises = subcategories.map(async (subcat) => {
        if (subcat.image && subcat.image.length > 0) {
          const deleteImagesPromises = subcat.image.map((imageId) => safeDeleteFile(imageId));
          await Promise.all(deleteImagesPromises);
        }
        // Delete the subcategory
        await db.Categories.delete(subcat.$id);
      });

      await Promise.all(deleteSubcategoriesPromises);

      // 6. Delete main category image and category
      if (categoryToDelete.image && categoryToDelete.image.length > 0) {
        const deleteMainImagesPromises = categoryToDelete.image.map((imageId) =>
          safeDeleteFile(imageId)
        );
        await Promise.all(deleteMainImagesPromises);
      }
      await db.Categories.delete(categoryToDelete.$id);

      // 7. Update state and UI
      setCategoryList(categoryList.filter((c) => !allCategoryIdsToDelete.includes(c.$id)));
      setDeleteModal(false);
      setCategoryToDelete(null);
      toast.success("Category and all associated subcategories and products deleted successfully.");
    } catch (error) {
      console.error("Failed to delete category and its associations:", error);
      toast.error("Failed to delete category. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get image URL
  const getImageURL = (imageId) => storageServices.images.getFilePreview(imageId);

  // Define table columns
  const columns = useMemo(
    () => [
      {
        header: "Image",
        accessorKey: "image",
        enableColumnFilter: false,
        cell: (cell) => {
          const imageArray = cell.getValue();
          const imageId = imageArray && imageArray.length > 0 ? imageArray[0] : null;
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
              src="/path/to/default-category-image.jpg" // Replace with your default image path
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
        header: "Parent Category",
        accessorKey: "parentCategoryId",
        enableColumnFilter: false,
        cell: (cell) => {
          const parentCategoryId = cell.getValue();
          const parentCategory = categoryList.find((c) => c.$id === parentCategoryId);
          return parentCategory ? parentCategory.name : "Main";
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        enableColumnFilter: false,
        cell: (cell) => <span>{cell.getValue() || "No description."}</span>,
      },
      {
        header: "Action",
        cell: (cell) => (
          <UncontrolledDropdown>
            <DropdownToggle
              href="#"
              className="btn btn-soft-secondary btn-sm"
              tag="button"
            >
              <i className="ri-more-fill" />
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end">
              <DropdownItem
                tag={Link}
                to={`/apps-ecommerce-edit-category/${cell.row.original.$id}`}
              >
                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Edit
              </DropdownItem>
              <DropdownItem
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCategoryToDelete(cell.row.original);
                  setDeleteModal(true);
                }}
              >
                <i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i> Delete
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        ),
      },
    ],
    [categoryList]
  );

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} limit={1} />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteCategory}
        onCloseClick={() => {
          setDeleteModal(false);
          setCategoryToDelete(null);
        }}
        requireConfirmation={true}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${
          categoryToDelete?.name
        }" and all its associated subcategories and products?`}
      />

      <Container fluid>
        <BreadCrumb title="Categories" pageTitle="Ecommerce" />
        <Row className="mb-3">
          <Col>
            <Button color="success" tag={Link} to="/apps-ecommerce-add-category">
              <i className="ri-add-line align-bottom me-1"></i> Add Category
            </Button>
          </Col>
        </Row>

        <Row>
          <Col xl={12}>
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Categories</h5>
              </CardHeader>
              <CardBody>
                {isLoading ? (
                  <div className="py-4 text-center">Loading data...</div>
                ) : categoryList.length > 0 ? (
                  <TableContainer
                    columns={columns}
                    data={categoryList}
                    isGlobalFilter={true}
                    customPageSize={10}
                    divClass="table-responsive mb-1"
                    tableClass="mb-0 align-middle table-borderless"
                    theadClass="table-light text-muted"
                    SearchPlaceholder="Search Categories..."
                  />
                ) : (
                  <div className="py-4 text-center">No categories found</div>
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
