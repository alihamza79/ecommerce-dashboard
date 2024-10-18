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

  // Function to delete category
  const handleDeleteCategory = async () => {
    if (categoryToDelete) {
      try {
        if (categoryToDelete.image && categoryToDelete.image.length > 0) {
          await storageServices.images.deleteFile(categoryToDelete.image[0]);
        }
        await db.Categories.delete(categoryToDelete.$id);
        setCategoryList(categoryList.filter(c => c.$id !== categoryToDelete.$id));
        setDeleteModal(false);
        toast.success("Category deleted successfully");
      } catch (error) {
        console.error("Failed to delete category:", error);
        toast.error("Failed to delete category");
      }
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
              style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
            />
          ) : (
            <img
              src="/path/to/default-category-image.jpg"
              alt="Default"
              style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
            />
          );
        },
      },
      {
        header: "Category Name",
        accessorKey: "name",
        enableColumnFilter: false,
        cell: (cell) => (
          <Link to={`/apps-ecommerce-edit-category/${cell.row.original.$id}`} className="text-body">
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
          const parentCategory = categoryList.find(c => c.$id === parentCategoryId);
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
            <DropdownToggle href="#" className="btn btn-soft-secondary btn-sm" tag="button">
              <i className="ri-more-fill" />
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end">
              <DropdownItem tag={Link} to={`/apps-ecommerce-edit-category/${cell.row.original.$id}`}>
                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Edit
              </DropdownItem>
              <DropdownItem href="#" onClick={() => setDeleteModal(true)}>
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
        onCloseClick={() => setDeleteModal(false)}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
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
