// src/pages/Ecommerce/EcommerceEditCategory.js

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormFeedback,
  Input,
  Label,
  Row,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import Dropzone from "react-dropzone";
import { useNavigate, useParams } from "react-router-dom";
import db from "../../../appwrite/Services/dbServices";
import storageServices from "../../../appwrite/Services/storageServices"; // Import storage services
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";

const EcommerceEditCategory = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { categoryId } = params;
  const [selectedFile, setSelectedFile] = useState(null); // For new image
  const [existingImage, setExistingImage] = useState(null); // Existing image ID
  const [categoryData, setCategoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Fetch existing category data on component mount
  useEffect(() => {
    const fetchCategory = async () => {
      console.log("Category ID from params:", categoryId);

      if (!categoryId) {
        console.error("Category ID is undefined");
        toast.error("Invalid category ID");
        setIsLoading(false);
        return;
      }

      try {
        const category = await db.Categories.get(categoryId);
        console.log("Fetched category data:", category);
        setCategoryData(category);
        setExistingImage(category.image && category.image.length > 0 ? category.image[0] : null);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch category:", error);
        toast.error("Failed to fetch category data");
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  // Handle file upload (for preview, store the selected file in state)
  const handleAcceptedFiles = (files) => {
    if (files.length > 0) {
      const file = files[0]; // Only one image allowed
      const previewFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });
      setSelectedFile(previewFile);
    }
  };

  // Remove the selected new image
  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  // Remove the existing image
  const removeExistingImage = async () => {
    try {
      if (existingImage) {
        // Delete the image file from storage
        await storageServices.images.deleteFile(existingImage);
        setExistingImage(null);
        toast.success("Existing image removed successfully");
      }
    } catch (error) {
      console.error("Failed to delete existing image:", error);
      toast.error("Failed to delete existing image");
    }
  };

  // Initialize Formik for form handling
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: categoryData?.name || "",
      description: categoryData?.description || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please enter a category name"),
      description: Yup.string(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        let imageId = existingImage;

        // Upload new image if selected
        if (selectedFile) {
          // If there's an existing image, delete it first
          if (existingImage) {
            await storageServices.images.deleteFile(existingImage);
          }
          const storedFile = await storageServices.images.createFile(selectedFile);
          imageId = storedFile.$id; // Update with new image ID
        }

        // Prepare the updated category data
        const updatedCategory = {
          name: values.name,
          description: values.description,
          image: imageId ? [imageId] : [], // Store as an array
        };

        // Update the category in the Appwrite database
        await db.Categories.update(categoryId, updatedCategory);
        toast.success("Category updated successfully");
        // Redirect to categories list after a short delay
        setTimeout(() => {
          navigate("/apps-ecommerce-categories");
        }, 1500);
      } catch (error) {
        console.error("Failed to update category:", error);
        toast.error("Failed to update category. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Function to get image URL
  const getImageURL = (imageId) => {
    return storageServices.images.getFilePreview(imageId);
  };

  // Show loading state until data is fetched
  if (isLoading) {
    return (
      <div className="page-content">
        <Container fluid>
          <h3>Loading...</h3>
        </Container>
      </div>
    );
  }

  // If category data is not found
  if (!categoryData) {
    return (
      <div className="page-content">
        <Container fluid>
          <h3>Category not found.</h3>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Toast notifications */}
      <ToastContainer closeButton={false} limit={1} />

      <Container fluid>
        {/* Breadcrumb for navigation */}
        <BreadCrumb title="Edit Category" pageTitle="Ecommerce" />

        <Row>
          <Col lg={8} className="mx-auto">
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Edit Category</h5>
              </CardHeader>
              <CardBody>
                {/* Category Editing Form */}
                <Form onSubmit={formik.handleSubmit}>
                  {/* Category Name Field */}
                  <div className="mb-3">
                    <Label className="form-label" htmlFor="category-name">
                      Category Name <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      className="form-control"
                      id="category-name"
                      name="name"
                      placeholder="Enter category name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      invalid={
                        formik.touched.name && formik.errors.name ? true : false
                      }
                    />
                    {formik.touched.name && formik.errors.name ? (
                      <FormFeedback>{formik.errors.name}</FormFeedback>
                    ) : null}
                  </div>

                  {/* Category Description Field */}
                  <div className="mb-3">
                    <Label className="form-label" htmlFor="category-description">
                      Description
                    </Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      id="category-description"
                      name="description"
                      placeholder="Enter category description"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      invalid={
                        formik.touched.description && formik.errors.description
                          ? true
                          : false
                      }
                    />
                    {formik.touched.description && formik.errors.description ? (
                      <FormFeedback>{formik.errors.description}</FormFeedback>
                    ) : null}
                  </div>

                  {/* Category Image Upload */}
                  <Card className="mb-3">
                    <CardHeader>
                      <h5 className="card-title mb-0">Category Image</h5>
                    </CardHeader>
                    <CardBody>
                      {/* Display Existing Image */}
                      {existingImage ? (
                        <div className="mb-3">
                          <div className="position-relative d-inline-block">
                            <img
                              src={getImageURL(existingImage)}
                              alt="Existing"
                              className="img-thumbnail"
                              style={{ width: "200px", height: "200px", objectFit: "cover" }}
                            />
                            <Button
                              color="danger"
                              size="sm"
                              className="position-absolute top-0 end-0"
                              onClick={removeExistingImage}
                            >
                              <i className="ri-close-line"></i>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <Label>No existing image.</Label>
                        </div>
                      )}

                      {/* Upload New Image */}
                      <Dropzone
                        onDrop={(acceptedFiles) => {
                          handleAcceptedFiles(acceptedFiles);
                        }}
                        multiple={false} // Only one image allowed
                        accept={{
                          "image/*": [".png", ".jpg", ".jpeg", ".gif"],
                        }}
                      >
                        {({ getRootProps, getInputProps }) => (
                          <div className="dropzone dz-clickable">
                            <div
                              className="dz-message needsclick"
                              {...getRootProps()}
                            >
                              <div className="mb-3 mt-5">
                                <i className="display-4 text-muted ri-upload-cloud-2-fill" />
                              </div>
                              <h5>Drop a new image here or click to upload.</h5>
                            </div>
                          </div>
                        )}
                      </Dropzone>

                      {/* New Image Preview */}
                      {selectedFile && (
                        <div className="mt-3">
                          <div className="position-relative d-inline-block">
                            <img
                              src={selectedFile.preview}
                              alt="Selected"
                              className="img-thumbnail"
                              style={{ width: "200px", height: "200px", objectFit: "cover" }}
                            />
                            <Button
                              color="danger"
                              size="sm"
                              className="position-absolute top-0 end-0"
                              onClick={removeSelectedFile}
                            >
                              <i className="ri-close-line"></i>
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {/* Submit Button */}
                  <div className="text-end">
                    <Button
                      type="submit"
                      color="success"
                      disabled={formik.isSubmitting}
                    >
                      {formik.isSubmitting ? "Updating..." : "Update Category"}
                    </Button>
                  </div>
                </Form>
                {/* End of Form */}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EcommerceEditCategory;
