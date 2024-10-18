import React, { useState, useEffect } from "react";
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
import storageServices from "../../../appwrite/Services/storageServices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Select from "react-select";

const EcommerceAddCategory = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [categoryType, setCategoryType] = useState("category");
  const [categories, setCategories] = useState([]);
  const [parentCategoryId, setParentCategoryId] = useState(null);

  // Fetch categories for parent selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await db.Categories.list();
        // Filter categories to only include those without a parentCategoryId (i.e., top-level categories)
        const categoryOptions = response.documents
          .filter((cat) => cat.parentCategoryId === null)
          .map((cat) => ({
            label: cat.name,
            value: cat.$id,
          }));
        setCategories(categoryOptions);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to fetch categories for parent selection.");
      }
    };

    // Always fetch categories regardless of category type
    fetchCategories();
  }, []);

  // Handle file upload
  const handleAcceptedFiles = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      const previewFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });
      setSelectedFile(previewFile);
    }
  };

  // Remove selected image
  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  // Cleanup image preview
  useEffect(() => {
    return () => {
      if (selectedFile) {
        URL.revokeObjectURL(selectedFile.preview);
      }
    };
  }, [selectedFile]);

  // Formik setup
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

        // Upload image
        if (selectedFile) {
          const storedFile = await storageServices.images.createFile(selectedFile);
          imageId = storedFile.$id;
        }

        // Prepare category data
        const newCategory = {
          name: values.name,
          description: values.description,
          image: imageId ? [imageId] : [],
          parentCategoryId: categoryType === "subcategory" ? parentCategoryId : null,
        };

        // Save category
        await db.Categories.create(newCategory);
        toast.success("Category added successfully");
        resetForm();
        setSelectedFile(null);
        setParentCategoryId(null);
        navigate("/apps-ecommerce-categories");
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
                <h5 className="card-title mb-0">Create New Category/Subcategory</h5>
              </CardHeader>
              <CardBody>
                {/* Category Type Selection */}
                <div className="mb-3">
                  <Label className="form-label">Category Type</Label>
                  <div>
                    <div className="form-check form-check-inline">
                      <Input
                        type="radio"
                        name="categoryType"
                        id="category"
                        value="category"
                        checked={categoryType === "category"}
                        onChange={() => setCategoryType("category")}
                        className="form-check-input"
                      />
                      <Label className="form-check-label" htmlFor="category">
                        Category
                      </Label>
                    </div>
                    <div className="form-check form-check-inline">
                      <Input
                        type="radio"
                        name="categoryType"
                        id="subcategory"
                        value="subcategory"
                        checked={categoryType === "subcategory"}
                        onChange={() => setCategoryType("subcategory")}
                        className="form-check-input"
                      />
                      <Label className="form-check-label" htmlFor="subcategory">
                        Subcategory
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Category/Subcategory Form */}
                <Form onSubmit={formik.handleSubmit}>
                  {/* Name Field */}
                  <div className="mb-3">
                    <Label className="form-label" htmlFor="category-name">
                      {categoryType === "category" ? "Category Name" : "Subcategory Name"}{" "}
                      <span className="text-danger">*</span>
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
                      invalid={formik.touched.name && formik.errors.name ? true : false}
                    />
                    {formik.touched.name && formik.errors.name ? (
                      <FormFeedback>{formik.errors.name}</FormFeedback>
                    ) : null}
                  </div>

                  {/* Parent Category Selection for Subcategory */}
                  {categoryType === "subcategory" && (
                    <div className="mb-3">
                      <Label className="form-label" htmlFor="parent-category">
                        Parent Category <span className="text-danger">*</span>
                      </Label>
                      <Select
                        id="parent-category"
                        options={categories}
                        value={categories.find((cat) => cat.value === parentCategoryId)}
                        onChange={(option) => setParentCategoryId(option.value)}
                        placeholder="Select parent category"
                      />
                      {!parentCategoryId && (
                        <div className="text-danger mt-1">
                          Please select a parent category.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description Field */}
                  <div className="mb-3">
                    <Label className="form-label" htmlFor="category-description">
                      Description
                    </Label>
                    <Input
                      type="textarea"
                      className="form-control"
                      id="category-description"
                      name="description"
                      placeholder="Enter description"
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

                  {/* Image Upload */}
                  <Card className="mb-3">
                    <CardHeader>
                      <h5 className="card-title mb-0">Upload Image</h5>
                    </CardHeader>
                    <CardBody>
                      <Dropzone
                        onDrop={handleAcceptedFiles}
                        multiple={false} // Only one image allowed
                        accept={{
                          "image/*": [".png", ".jpg", ".jpeg", ".gif"],
                        }}
                        maxSize={5242880} // 5MB
                      >
                        {({
                          getRootProps,
                          getInputProps,
                          isDragActive,
                          isDragReject,
                          rejectedFiles,
                        }) => {
                          const safeRejectedFiles = Array.isArray(rejectedFiles)
                            ? rejectedFiles
                            : [];
                          const isFileTooLarge =
                            safeRejectedFiles.length > 0 &&
                            safeRejectedFiles[0].size > 5242880;

                          return (
                            <div className="dropzone dz-clickable" {...getRootProps()}>
                              <input {...getInputProps()} />

                              <div className="dz-message needsclick">
                                <div className="mb-3 mt-5">
                                  <i className="display-4 text-muted ri-upload-cloud-2-fill" />
                                </div>
                                <h5>Drop an image here or click to upload.</h5>
                                {isDragActive && !isDragReject && (
                                  <p className="mt-2 text-primary">
                                    Drop the files here...
                                  </p>
                                )}
                                {isDragReject && (
                                  <p className="mt-2 text-danger">
                                    Unsupported file type.
                                  </p>
                                )}
                                {isFileTooLarge && (
                                  <p className="mt-2 text-danger">File is too large.</p>
                                )}
                              </div>
                            </div>
                          );
                        }}
                      </Dropzone>

                      {/* Image Preview */}
                      {selectedFile && (
                        <div className="mt-3">
                          <div className="position-relative d-inline-block">
                            <img
                              src={selectedFile.preview}
                              alt="Selected"
                              className="img-thumbnail"
                              style={{
                                width: "200px",
                                height: "200px",
                                objectFit: "cover",
                              }}
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
                      disabled={
                        formik.isSubmitting ||
                        (categoryType === "subcategory" && !parentCategoryId)
                      }
                    >
                      {formik.isSubmitting
                        ? "Submitting..."
                        : categoryType === "category"
                        ? "Add Category"
                        : "Add Subcategory"}
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EcommerceAddCategory;
