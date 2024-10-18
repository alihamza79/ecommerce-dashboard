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
import storageServices from "../../../appwrite/Services/storageServices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Select from "react-select";

const EcommerceEditCategory = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { categoryId } = params;
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryType, setCategoryType] = useState("category");
  const [categories, setCategories] = useState([]);
  const [parentCategoryId, setParentCategoryId] = useState(null);

  // Fetch existing category data on component mount
  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) {
        console.error("Category ID is undefined");
        toast.error("Invalid category ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const category = await db.Categories.get(categoryId);
        setCategoryData(category);

        // Determine category type
        if (category.parentCategoryId) {
          setCategoryType("subcategory");
          setParentCategoryId(category.parentCategoryId);
        } else {
          setCategoryType("category");
        }

        setExistingImage(
          category.image && category.image.length > 0 ? category.image[0] : null
        );
      } catch (error) {
        console.error("Failed to fetch category:", error);
        toast.error("Failed to fetch category data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  // Fetch categories for parent selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await db.Categories.list();
        // Remove the filter to include all categories except the current one
        const categoryOptions = response.documents
          .filter((cat) => cat.$id !== categoryId) // Exclude the current category
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

    fetchCategories();
  }, [categoryId]);

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

  // Cleanup image previews to avoid memory leaks
  useEffect(() => {
    return () => {
      if (selectedFile) {
        URL.revokeObjectURL(selectedFile.preview);
      }
    };
  }, [selectedFile]);

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
          image: imageId ? [imageId] : [],
          parentCategoryId: categoryType === "subcategory" ? parentCategoryId : null,
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
          {/* Loading Indicator */}
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
                <h5 className="card-title mb-0">Edit Category/Subcategory</h5>
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
                        onChange={() => {
                          setCategoryType("category");
                          setParentCategoryId(null);
                        }}
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

                {/* Category Editing Form */}
                <Form onSubmit={formik.handleSubmit}>
                  {/* Category Name Field */}
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
                              {/* Render the input element */}
                              <input {...getInputProps()} />

                              <div className="dz-message needsclick">
                                <div className="mb-3 mt-5">
                                  <i className="display-4 text-muted ri-upload-cloud-2-fill" />
                                </div>
                                <h5>Drop a new image here or click to upload.</h5>
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

                      {/* New Image Preview */}
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
