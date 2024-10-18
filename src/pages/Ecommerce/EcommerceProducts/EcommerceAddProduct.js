// src/components/dashboard/EcommerceAddProduct.jsx

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import Dropzone from "react-dropzone";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Input,
  Label,
  Form,
  FormFeedback,
  Button,
  CardHeader,
  Alert,
} from "reactstrap";
import Select from "react-select";
import db from "../../../appwrite/Services/dbServices";
import storageServices from "../../../appwrite/Services/storageServices";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { Query } from "appwrite"; // Import Query for pagination

const EcommerceAddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const limit = 100; // Adjust the limit as needed

  // Function to fetch all categories with pagination
  const fetchAllCategories = async () => {
    let allCategories = [];
    let offset = 0;
    let fetchedCategories = [];

    try {
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

      // Map categories to the format required by react-select
      const categoryOptions = allCategories.map((cat) => ({
        label: cat.name,
        value: cat.$id,
      }));
      setCategories(categoryOptions);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setFetchError("Failed to fetch categories. Please try again later.");
      setCategories([]);
    }
  };

  // Fetch categories from Appwrite
  useEffect(() => {
    fetchAllCategories();
  }, []);

  // Handle file uploads (for preview, store the selected files in state)
  const handleAcceptedFiles = (files) => {
    if (!Array.isArray(files)) {
      console.error("Accepted files is not an array:", files);
      return;
    }

    const previewFiles = files.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setSelectedFiles((prevFiles) => [...prevFiles, ...previewFiles]);
    console.log("Selected Files after drop:", [...selectedFiles, ...previewFiles]);
  };

  // Remove a selected image
  const removeSelectedFile = (file) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((f) => f !== file));
    console.log("Selected Files after removal:", selectedFiles.filter((f) => f !== file));
  };

  // Cleanup image previews to avoid memory leaks
  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [selectedFiles]);

  // Formik validation schema
  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      price: "",
      stockQuantity: "",
      categoryId: "",
      tags: "",
      isOnSale: false,
      discountPrice: "",
      productType: "retail",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please enter a product title"),
      price: Yup.number()
        .typeError("Price must be a number")
        .positive("Price must be a positive number")
        .required("Please enter a product price"),
      stockQuantity: Yup.number()
        .typeError("Stock Quantity must be a number")
        .integer("Stock Quantity must be an integer")
        .min(0, "Stock Quantity cannot be negative")
        .required("Please enter the product stock"),
      categoryId: Yup.string().required("Please select a product category"),
      productType: Yup.string()
        .oneOf(["retail", "wholesale"], "Invalid product type")
        .required("Please select a product type"),
      isOnSale: Yup.boolean().notRequired(),
      discountPrice: Yup.number()
        .transform((value, originalValue) =>
          originalValue === "" ? null : value
        )
        .nullable()
        .when("isOnSale", {
          is: true,
          then: () =>
            Yup.number()
              .typeError("Discount Price must be a number")
              .positive("Discount Price must be a positive number")
              .required("Please enter a discount price")
              .max(
                Yup.ref("price"),
                "Discount Price must be less than the original price"
              ),
          otherwise: () => Yup.number().notRequired(),
        }),
      tags: Yup.string(),
      description: Yup.string(),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        console.log("Form Values on Submit:", values);
        let imageIds = [];

        // Upload the selected images to Appwrite storage on form submission
        if (selectedFiles.length > 0) {
          imageIds = await Promise.all(
            selectedFiles.map(async (file) => {
              try {
                const storedFile = await storageServices.images.createFile(file);
                if (storedFile && storedFile.$id) {
                  console.log(`Uploaded File ID: ${storedFile.$id}`);
                  return storedFile.$id;
                } else {
                  throw new Error("Invalid response from image upload.");
                }
              } catch (error) {
                console.error("Image upload error:", error);
                return null; // Exclude failed uploads
              }
            })
          );

          // Filter out any null entries resulting from failed uploads
          imageIds = imageIds.filter((id) => id !== null);
          console.log("Uploaded Image IDs:", imageIds);
        }

        // Prepare the product data to save
        const newProduct = {
          name: values.name,
          description: values.description,
          price: parseFloat(values.price),
          stockQuantity: parseInt(values.stockQuantity, 10),
          categoryId: values.categoryId,
          images: imageIds,
          tags: values.tags
            ? values.tags.split(",").map((tag) => tag.trim())
            : [],
          isOnSale: values.isOnSale,
          discountPrice: values.isOnSale
            ? parseFloat(values.discountPrice)
            : null,
          isWholesaleProduct: values.productType === "wholesale",
        };

        console.log("New Product Data:", newProduct);

        // Save the product to the Appwrite Products collection
        await db.Products.create(newProduct);
        console.log("Product successfully created.");
        resetForm();
        setSelectedFiles([]);
        navigate("/apps-ecommerce-products");
      } catch (error) {
        console.error("Failed to create product:", error);
        setSubmitError("Failed to create product. Please try again.");
      }
    },
  });

  return (
    <div className="page-content">
      <Container fluid>
        <h3>Create Product</h3>
        <Row>
          <Col lg={8}>
            <Form onSubmit={formik.handleSubmit}>
              {/* Display Submission Error */}
              {submitError && (
                <Alert color="danger" className="mb-3">
                  {submitError}
                </Alert>
              )}

              <Card>
                <CardBody>
                  {/* Product Type Selection */}
                  <div className="mb-3">
                    <Label className="form-label">Product Type</Label>
                    <div>
                      <div className="form-check form-check-inline">
                        <Input
                          type="radio"
                          name="productType"
                          id="retail"
                          value="retail"
                          checked={formik.values.productType === "retail"}
                          onChange={() =>
                            formik.setFieldValue("productType", "retail")
                          }
                          className="form-check-input"
                        />
                        <Label className="form-check-label" htmlFor="retail">
                          Retail
                        </Label>
                      </div>
                      <div className="form-check form-check-inline">
                        <Input
                          type="radio"
                          name="productType"
                          id="wholesale"
                          value="wholesale"
                          checked={formik.values.productType === "wholesale"}
                          onChange={() =>
                            formik.setFieldValue("productType", "wholesale")
                          }
                          className="form-check-input"
                        />
                        <Label className="form-check-label" htmlFor="wholesale">
                          Wholesale
                        </Label>
                      </div>
                    </div>
                    {formik.errors.productType && formik.touched.productType && (
                      <FormFeedback type="invalid" className="d-block">
                        {formik.errors.productType}
                      </FormFeedback>
                    )}
                  </div>

                  {/* Product Title */}
                  <div className="mb-3">
                    <Label className="form-label" htmlFor="product-title-input">
                      Product Title
                    </Label>
                    <Input
                      type="text"
                      className="form-control"
                      id="product-title-input"
                      placeholder="Enter product title"
                      name="name"
                      value={formik.values.name}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      invalid={
                        formik.errors.name && formik.touched.name
                          ? true
                          : false
                      }
                    />
                    {formik.errors.name && formik.touched.name ? (
                      <FormFeedback type="invalid">
                        {formik.errors.name}
                      </FormFeedback>
                    ) : null}
                  </div>

                  {/* Product Description */}
                  <div className="mb-3">
                    <Label>Product Description</Label>
                    <CKEditor
                      editor={ClassicEditor}
                      data={formik.values.description}
                      onChange={(event, editor) => {
                        formik.setFieldValue("description", editor.getData());
                      }}
                    />
                    {formik.errors.description && formik.touched.description ? (
                      <FormFeedback type="invalid" className="d-block">
                        {formik.errors.description}
                      </FormFeedback>
                    ) : null}
                  </div>

                  {/* Product Gallery */}
                  <Card>
                    <CardHeader>
                      <h5 className="card-title mb-0">Product Gallery</h5>
                    </CardHeader>
                    <CardBody>
                      <div className="mb-4">
                        <h5 className="fs-14 mb-1">Product Images</h5>
                        <Dropzone
                          onDrop={handleAcceptedFiles}
                          accept={{
                            "image/*": [".jpeg", ".png", ".gif", ".bmp", ".webp"],
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
                                  <h5>Drop files here or click to upload.</h5>
                                  {isDragActive && !isDragReject && (
                                    <p className="mt-2 text-primary">Drop the files here...</p>
                                  )}
                                  {isDragReject && (
                                    <p className="mt-2 text-danger">Unsupported file type.</p>
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
                        <div className="list-unstyled mb-0" id="file-previews">
                          {selectedFiles.map((f, i) => (
                            <Card
                              className="mt-1 mb-0 shadow-none border dz-processing dz-image-preview dz-success dz-complete"
                              key={i + "-file"}
                            >
                              <div className="p-2">
                                <Row className="align-items-center">
                                  <Col className="col-auto">
                                    <img
                                      data-dz-thumbnail=""
                                      height="80"
                                      className="avatar-sm rounded bg-light"
                                      alt={f.name}
                                      src={f.preview}
                                    />
                                  </Col>
                                  <Col>
                                    <p className="text-muted font-weight-bold mb-0">
                                      {f.name}
                                    </p>
                                  </Col>
                                  <Col className="col-auto">
                                    <Button
                                      color="danger"
                                      size="sm"
                                      onClick={() => removeSelectedFile(f)}
                                    >
                                      Remove
                                    </Button>
                                  </Col>
                                </Row>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </CardBody>
              </Card>

              {/* General Info (Price and Stock) */}
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">General Info</h5>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">
                          {formik.values.productType === "wholesale"
                            ? "Wholesale Price"
                            : "Price"}
                        </Label>
                        <Input
                          type="number"
                          className="form-control"
                          name="price"
                          placeholder={`Enter ${
                            formik.values.productType === "wholesale"
                              ? "wholesale"
                              : "retail"
                          } price`}
                          value={formik.values.price}
                          onBlur={formik.handleBlur}
                          onChange={formik.handleChange}
                          invalid={
                            formik.errors.price && formik.touched.price
                              ? true
                              : false
                          }
                        />
                        {formik.errors.price && formik.touched.price ? (
                          <FormFeedback type="invalid">
                            {formik.errors.price}
                          </FormFeedback>
                        ) : null}
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">
                          {formik.values.productType === "wholesale"
                            ? "Wholesale Stock Quantity"
                            : "Stock Quantity"}
                        </Label>
                        <Input
                          type="number"
                          className="form-control"
                          name="stockQuantity"
                          placeholder={`Enter ${
                            formik.values.productType === "wholesale"
                              ? "wholesale"
                              : "retail"
                          } stock quantity`}
                          value={formik.values.stockQuantity}
                          onBlur={formik.handleBlur}
                          onChange={formik.handleChange}
                          invalid={
                            formik.errors.stockQuantity &&
                            formik.touched.stockQuantity
                              ? true
                              : false
                          }
                        />
                        {formik.errors.stockQuantity && formik.touched.stockQuantity ? (
                          <FormFeedback type="invalid">
                            {formik.errors.stockQuantity}
                          </FormFeedback>
                        ) : null}
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>

              <div className="text-end mb-3">
                <Button type="submit" color="success">
                  Submit
                </Button>
              </div>
            </Form>
          </Col>

          {/* Right Side: Product Categories, Tags, On Sale, and Wholesale Options */}
          <Col lg={4}>
            {/* Display Category Fetch Error */}
            {fetchError && (
              <Alert color="danger" className="mb-3">
                {fetchError}
              </Alert>
            )}

            {/* Product Categories Container */}
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Product Categories</h5>
              </CardHeader>
              <CardBody>
                <Select
                  value={categories.find(
                    (cat) => cat.value === formik.values.categoryId
                  )}
                  onChange={(option) =>
                    formik.setFieldValue("categoryId", option.value)
                  }
                  options={categories}
                  name="categoryId"
                  classNamePrefix="select2-selection form-select"
                  placeholder="Select a category"
                />
                {formik.errors.categoryId && formik.touched.categoryId ? (
                  <FormFeedback type="invalid" className="d-block">
                    {formik.errors.categoryId}
                  </FormFeedback>
                ) : null}
              </CardBody>
            </Card>

            {/* Product Tags Container */}
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Product Tags</h5>
              </CardHeader>
              <CardBody>
                <Input
                  className="form-control"
                  placeholder="Enter tags separated by commas"
                  type="text"
                  name="tags"
                  value={formik.values.tags}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  invalid={
                    formik.errors.tags && formik.touched.tags
                      ? true
                      : false
                  }
                />
                {formik.errors.tags && formik.touched.tags ? (
                  <FormFeedback type="invalid">
                    {formik.errors.tags}
                  </FormFeedback>
                ) : null}
              </CardBody>
            </Card>

            {/* On Sale Toggle Switch */}
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">On Sale</h5>
              </CardHeader>
              <CardBody>
                <div className="form-check form-switch mb-3">
                  <Input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="isOnSale"
                    name="isOnSale"
                    checked={formik.values.isOnSale}
                    onChange={(e) => {
                      formik.handleChange(e);
                      if (!e.target.checked) {
                        formik.setFieldValue("discountPrice", ""); // Reset discountPrice
                      }
                    }}
                  />
                  <Label className="form-check-label" htmlFor="isOnSale">
                    Is On Sale
                  </Label>
                </div>

                {/* Discount Price Field */}
                {formik.values.isOnSale && (
                  <div className="mb-3">
                    <Label htmlFor="discountPrice">Discount Price</Label>
                    <Input
                      type="number"
                      className="form-control"
                      id="discountPrice"
                      placeholder="Enter discount price"
                      name="discountPrice"
                      value={formik.values.discountPrice}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      invalid={
                        formik.errors.discountPrice &&
                        formik.touched.discountPrice
                          ? true
                          : false
                      }
                    />
                    {formik.errors.discountPrice && formik.touched.discountPrice ? (
                      <FormFeedback type="invalid">
                        {formik.errors.discountPrice}
                      </FormFeedback>
                    ) : null}
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

export default EcommerceAddProduct;
