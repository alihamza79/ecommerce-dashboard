// src/pages/Ecommerce/EcommerceAddCategory.js

import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Dropzone from "react-dropzone";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Form,
  FormFeedback,
  Input,
  Label,
  Row,
  CardHeader,
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import db from "../../../appwrite/Services/dbServices";
import storageServices from "../../../appwrite/Services/storageServices"; // Import storage services
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";

const EcommerceAddCategory = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null); // Single image state

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

  // Remove the selected image
  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  // Initialize Formik for form handling
  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please enter a category name"),
      description: Yup.string(),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        let imageId = null;

        // Upload the selected image to Appwrite storage on form submission
        if (selectedFile) {
          const storedFile = await storageServices.images.createFile(selectedFile);
          imageId = storedFile.$id; // Store the image ID
        }

        // Prepare the category data to save
        const newCategory = {
          name: values.name,
          description: values.description,
          image: imageId ? [imageId] : [], // Store as an array
        };

        // Save the category to the Appwrite Categories collection
        await db.Categories.create(newCategory);
        toast.success("Category added successfully");
        resetForm();
        setSelectedFile(null);
        // Redirect to categories list after a short delay
        setTimeout(() => {
          navigate("/apps-ecommerce-categories");
        }, 1500);
      } catch (error) {
        console.error("Failed to add category:", error);
        toast.error("Failed to add category. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="page-content">
      {/* Toast notifications */}
      <ToastContainer closeButton={false} limit={1} />

      <Container fluid>
        {/* Breadcrumb for navigation */}
        <BreadCrumb title="Add Category" pageTitle="Ecommerce" />

        <Row>
          <Col lg={8} className="mx-auto">
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Create New Category</h5>
              </CardHeader>
              <CardBody>
                {/* Category Creation Form */}
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
                              <h5>Drop an image here or click to upload.</h5>
                            </div>
                          </div>
                        )}
                      </Dropzone>

                      {/* Image Preview */}
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
                      {formik.isSubmitting ? "Submitting..." : "Add Category"}
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

export default EcommerceAddCategory;
