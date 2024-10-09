// src/pages/Ecommerce/EcommerceEditProduct.js

import React, { useState, useEffect } from "react";
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
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import Dropzone from "react-dropzone";
import Select from "react-select";
import { useNavigate, useParams } from "react-router-dom";
import db from "../../../appwrite/Services/dbServices";
import storageServices from "../../../appwrite/Services/storageServices";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EcommerceEditProduct = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { productId } = params;
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productType, setProductType] = useState("retail"); // 'retail' or 'wholesale'
  const [isOnSale, setIsOnSale] = useState(false);
  const [productData, setProductData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Fetch categories from Appwrite
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await db.Categories.list();
        const categoryOptions = response.documents.map((cat) => ({
          label: cat.name,
          value: cat.$id,
        }));
        setCategories(categoryOptions);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to fetch categories");
      }
    };

    fetchCategories();
  }, []);

  // Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      console.log("Product ID from params:", productId);

      if (!productId) {
        console.error("Product ID is undefined");
        toast.error("Invalid product ID");
        setIsLoading(false);
        return;
      }

      try {
        const product = await db.Products.get(productId);
        console.log("Fetched product data:", product);
        setProductData(product);
        setProductType(product.isWholesaleProduct ? "wholesale" : "retail");
        setIsOnSale(product.isOnSale);
        setExistingImages(product.images || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast.error("Failed to fetch product data");
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Handle file uploads
  const handleAcceptedFiles = (files) => {
    const previewFiles = files.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setSelectedFiles([...selectedFiles, ...previewFiles]);
  };

  // Remove an existing image and delete it from storage
  const removeExistingImage = async (imageId) => {
    try {
      // Delete the image file from storage
      await storageServices.images.deleteFile(imageId);

      // Update state
      setExistingImages(existingImages.filter((id) => id !== imageId));

      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast.error("Failed to delete image");
    }
  };

  // Remove a newly added image
  const removeSelectedFile = (file) => {
    setSelectedFiles(selectedFiles.filter((f) => f !== file));
  };

  // Formik validation schema
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: productData?.name || "",
      description: productData?.description || "",
      price: productData?.price || "",
      stockQuantity: productData?.stockQuantity || "",
      categoryId: productData?.categoryId || "",
      tags: productData?.tags ? productData.tags.join(",") : "",
      isOnSale: productData?.isOnSale || false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please enter a product title"),
      price: Yup.number()
        .typeError("Price must be a number")
        .required("Please enter a product price"),
      stockQuantity: Yup.number()
        .typeError("Stock Quantity must be a number")
        .required("Please enter the product stock"),
      categoryId: Yup.string().required("Please select a product category"),
      // tags: Yup.string(), // Optional: add validation if needed
      // description: Yup.string(), // Optional: add validation if needed
    }),
    onSubmit: async (values) => {
      try {
        let imageIds = existingImages; // Start with existing images

        // Upload new images to Appwrite storage
        if (selectedFiles.length > 0) {
          const uploadedImageIds = await Promise.all(
            selectedFiles.map(async (file) => {
              const storedFile = await storageServices.images.createFile(file);
              return storedFile.$id; // Store the image ID
            })
          );
          imageIds = [...imageIds, ...uploadedImageIds];
        }

        // Prepare the updated product data
        const updatedProduct = {
          name: values.name,
          description: values.description,
          price: parseFloat(values.price),
          stockQuantity: parseInt(values.stockQuantity),
          categoryId: values.categoryId,
          images: imageIds, // Updated image IDs
          tags: values.tags
            ? values.tags.split(",").map((tag) => tag.trim())
            : [],
          isOnSale: isOnSale,
          isWholesaleProduct: productType === "wholesale",
        };

        // Update the product in the Appwrite database
        await db.Products.update(productId, updatedProduct);
        toast.success("Product updated successfully");
        navigate("/apps-ecommerce-products");
      } catch (error) {
        console.error("Failed to update product:", error);
        toast.error("Failed to update product");
      }
    },
  });

  // Get image preview URL
  const getImageURL = (imageId) => {
    // Implement this function based on your storage service.
    // For example, if using Appwrite's storage service, you might need to construct the URL accordingly.
    // Here's a placeholder implementation:
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

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} limit={1} />
      <Container fluid>
        <h3>Edit Product</h3>
        <Form onSubmit={validation.handleSubmit}>
          <Row>
            <Col lg={8}>
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
                          checked={productType === "retail"}
                          onChange={() => setProductType("retail")}
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
                          checked={productType === "wholesale"}
                          onChange={() => setProductType("wholesale")}
                          className="form-check-input"
                        />
                        <Label className="form-check-label" htmlFor="wholesale">
                          Wholesale
                        </Label>
                      </div>
                    </div>
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
                      value={validation.values.name}
                      onBlur={validation.handleBlur}
                      onChange={validation.handleChange}
                      invalid={
                        validation.errors.name && validation.touched.name
                          ? true
                          : false
                      }
                    />
                    {validation.errors.name && validation.touched.name ? (
                      <FormFeedback type="invalid">
                        {validation.errors.name}
                      </FormFeedback>
                    ) : null}
                  </div>

                  {/* Product Description */}
                  <div className="mb-3">
                    <Label>Product Description</Label>
                    <CKEditor
                      editor={ClassicEditor}
                      data={validation.values.description || ""}
                      onChange={(event, editor) => {
                        validation.setFieldValue(
                          "description",
                          editor.getData()
                        );
                      }}
                    />
                    {validation.errors.description &&
                    validation.touched.description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.description}
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
                          onDrop={(acceptedFiles) => {
                            handleAcceptedFiles(acceptedFiles);
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
                                <h5>Drop files here or click to upload.</h5>
                              </div>
                            </div>
                          )}
                        </Dropzone>

                        {/* Existing Images */}
                        <div className="list-unstyled mb-0" id="existing-images">
                          {existingImages.map((imageId, index) => (
                            <Card
                              className="mt-1 mb-0 shadow-none border"
                              key={index + "-existing-image"}
                            >
                              <div className="p-2">
                                <Row className="align-items-center">
                                  <Col className="col-auto">
                                    <img
                                      height="80"
                                      className="avatar-sm rounded bg-light"
                                      alt={`Existing Image ${index + 1}`}
                                      src={getImageURL(imageId)}
                                    />
                                  </Col>
                                  <Col>
                                    <p className="text-muted font-weight-bold mb-0">
                                      Existing Image {index + 1}
                                    </p>
                                  </Col>
                                  <Col className="col-auto">
                                    <Button
                                      color="danger"
                                      size="sm"
                                      onClick={() =>
                                        removeExistingImage(imageId)
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </Col>
                                </Row>
                              </div>
                            </Card>
                          ))}
                        </div>

                        {/* New Image Preview */}
                        <div className="list-unstyled mb-0" id="new-image-previews">
                          {selectedFiles.map((f, i) => (
                            <Card
                              className="mt-1 mb-0 shadow-none border"
                              key={i + "-new-file"}
                            >
                              <div className="p-2">
                                <Row className="align-items-center">
                                  <Col className="col-auto">
                                    <img
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

              {/* General Info (Price, Stock, and Category) */}
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">General Info</h5>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">
                          {productType === "wholesale" ? "Wholesale Price" : "Price"}
                        </Label>
                        <Input
                          type="number"
                          className="form-control"
                          name="price"
                          placeholder={`Enter ${
                            productType === "wholesale" ? "wholesale" : "retail"
                          } price`}
                          value={validation.values.price}
                          onBlur={validation.handleBlur}
                          onChange={validation.handleChange}
                          invalid={
                            validation.errors.price && validation.touched.price
                              ? true
                              : false
                          }
                        />
                        {validation.errors.price && validation.touched.price ? (
                          <FormFeedback type="invalid">
                            {validation.errors.price}
                          </FormFeedback>
                        ) : null}
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">
                          {productType === "wholesale"
                            ? "Wholesale Stock Quantity"
                            : "Stock Quantity"}
                        </Label>
                        <Input
                          type="number"
                          className="form-control"
                          name="stockQuantity"
                          placeholder={`Enter ${
                            productType === "wholesale" ? "wholesale" : "retail"
                          } stock quantity`}
                          value={validation.values.stockQuantity}
                          onBlur={validation.handleBlur}
                          onChange={validation.handleChange}
                          invalid={
                            validation.errors.stockQuantity &&
                            validation.touched.stockQuantity
                              ? true
                              : false
                          }
                        />
                        {validation.errors.stockQuantity &&
                        validation.touched.stockQuantity ? (
                          <FormFeedback type="invalid">
                            {validation.errors.stockQuantity}
                          </FormFeedback>
                        ) : null}
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>

              <div className="text-end mb-3">
                <Button type="submit" color="success">
                  Update Product
                </Button>
              </div>
            </Col>

            {/* Right Side: Product Categories, Tags, On Sale, and Product Type */}
            <Col lg={4}>
              {/* Product Categories Container */}
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Product Categories</h5>
                </CardHeader>
                <CardBody>
                  <Select
                    value={categories.find(
                      (cat) => cat.value === validation.values.categoryId
                    )}
                    onChange={(option) =>
                      validation.setFieldValue("categoryId", option.value)
                    }
                    options={categories}
                    name="categoryId"
                    classNamePrefix="select2-selection form-select"
                  />
                  {validation.errors.categoryId &&
                  validation.touched.categoryId ? (
                    <FormFeedback type="invalid">
                      {validation.errors.categoryId}
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
                    value={validation.values.tags}
                    onBlur={validation.handleBlur}
                    onChange={validation.handleChange}
                    invalid={
                      validation.errors.tags && validation.touched.tags
                        ? true
                        : false
                    }
                  />
                  {validation.errors.tags && validation.touched.tags ? (
                    <FormFeedback type="invalid">
                      {validation.errors.tags}
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
                      checked={isOnSale}
                      onChange={() => setIsOnSale(!isOnSale)}
                    />
                    <Label className="form-check-label" htmlFor="isOnSale">
                      Is On Sale
                    </Label>
                  </div>

                  {/* Discount Price Field */}
                  {isOnSale && (
                    <div className="mb-3">
                      <Label htmlFor="discountPrice">Discount Price</Label>
                      <Input
                        type="number"
                        className="form-control"
                        id="discountPrice"
                        placeholder="Enter discount price"
                        name="discountPrice"
                        value={validation.values.discountPrice || ""}
                        onBlur={validation.handleBlur}
                        onChange={validation.handleChange}
                      />
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  );
};

export default EcommerceEditProduct;
