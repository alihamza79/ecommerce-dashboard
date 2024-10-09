import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownItem,
  DropdownMenu,
  Row,
  Card,
  CardHeader,
  CardBody,
  Col,
} from "reactstrap";
import DeleteModal from "../../../Components/Common/DeleteModal";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import { Link } from "react-router-dom";
import db from "../../../appwrite/Services/dbServices";
import storageServices from "../../../appwrite/Services/storageServices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BlogsList = () => {
  const [blogsList, setBlogsList] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  useEffect(() => {
    // Fetch blogs from Appwrite
    const fetchBlogs = async () => {
      try {
        const response = await db.blogs.list();
        console.log("Fetched blogs response:", response);
        const blogs = response.documents || [];
        console.log("Blogs array:", blogs);
        setBlogsList(blogs);
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
        toast.error("Failed to fetch blogs");
        setBlogsList([]); // Ensure blogsList is always an array
      }
    };
    fetchBlogs();
  }, []);

  // Function to handle delete
  const onClickDelete = (blog) => {
    setBlogToDelete(blog);
    setDeleteModal(true);
  };

  const handleDeleteBlog = async () => {
    if (blogToDelete) {
      try {
        // Delete associated image
        if (blogToDelete.imageUrl) {
          await storageServices.images.deleteFile(blogToDelete.imageUrl);
        }

        // Delete the blog document
        await db.blogs.delete(blogToDelete.$id);
        setDeleteModal(false);

        // Remove the deleted blog from the state
        setBlogsList(blogsList.filter((b) => b.$id !== blogToDelete.$id));

        toast.success("Blog deleted successfully");
      } catch (error) {
        console.error("Failed to delete blog:", error);
        toast.error("Failed to delete blog");
      }
    }
  };

  // Function to get image URL
  const getImageURL = (imageId) => {
    if (!imageId) return null;
    const imageUrlResponse = storageServices.images.getFilePreview(imageId);
    return imageUrlResponse.href;
  };

  // Table columns
  const columns = useMemo(
    () => [
      {
        header: "S/N",
        id: "serialNumber",
        cell: (info) => info.row.index + 1,
      },
      {
        header: "Image",
        accessorKey: "imageUrl",
        id: "image",
        cell: (info) => (
          <img
            src={getImageURL(info.row.original.imageUrl)}
            alt="Image"
            className="img-thumbnail"
            style={{ width: "100px", height: "100px", objectFit: "cover" }}
          />
        ),
      },
      {
        header: "Title",
        accessorKey: "title",
      },
      {
        header: "Author",
        accessorKey: "author",
      },
      {
        header: "Actions",
        id: "actions",
        cell: (info) => {
          const blogData = info.row.original;
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
                <DropdownItem tag={Link} to={`/editblog/${blogData.$id}`}>
                  <i className="ri-pencil-fill align-bottom me-2 text-muted"></i>{" "}
                  Edit
                </DropdownItem>
                <DropdownItem href="#" onClick={() => onClickDelete(blogData)}>
                  <i className="ri-delete-bin-fill align-bottom me-2 text-muted"></i>{" "}
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} limit={1} />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteBlog}
        onCloseClick={() => setDeleteModal(false)}
      />
      <Container fluid>
        <BreadCrumb title="News" pageTitle="News" />
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="d-flex align-items-center">
                <h4 className="card-title mb-0 flex-grow-1">News List</h4>
                <div className="flex-shrink-0">
                  <Link to="/addblog" className="btn btn-primary">
                    Add News
                  </Link>
                </div>
              </CardHeader>
              <CardBody>
                {blogsList && blogsList.length > 0 ? (
                  <TableContainer
                    columns={columns}
                    data={blogsList}
                    isGlobalFilter={true}
                    customPageSize={10}
                    divClass="table-responsive mb-1"
                    tableClass="mb-0 align-middle table-borderless"
                    theadClass="table-light text-muted"
                    SearchPlaceholder="Search News..."
                  />
                ) : (
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
                      <h5>No News Found</h5>
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

export default BlogsList;
