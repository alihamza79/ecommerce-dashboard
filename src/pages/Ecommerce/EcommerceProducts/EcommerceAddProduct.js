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
} from "reactstrap";
import Select from "react-select";
import db from "../../../appwrite/Services/dbServices";
import storageServices from "../../../appwrite/Services/storageServices";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const EcommerceAddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isWholesale, setIsWholesale] = useState(false);
  const [isOnSale, setIsOnSale] = useState(false); // Toggle state for "On Sale"

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
      }
    };

    fetchCategories();
  }, []);

  // Handle file uploads (for preview, store the selected files in state)
  const handleAcceptedFiles = (files) => {
    const previewFiles = files.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setSelectedFiles([...selectedFiles, ...previewFiles]); // Append new files
  };

  // Remove a selected image
  const removeSelectedFile = (file) => {
    setSelectedFiles(selectedFiles.filter((f) => f !== file));
  };

  // Formik validation schema
  const validation = useFormik({
    initialValues: {
      name: "",
      description: "",
      price: "",
      discountPrice: "",
      stockQuantity: "",
      categoryId: "",
      tags: "",
      isOnSale: false,
      isWholesaleProduct: false,
      wholesalePrice: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please Enter a Product Title"),
      price: Yup.number().required("Please Enter a Product Price"),
      stockQuantity: Yup.number().required("Please Enter the Product Stock"),
      categoryId: Yup.string().required("Please select a Product Category"),
    }),
    onSubmit: async (values) => {
      try {
        let imageIds = [];

        // Upload the selected images to Appwrite storage on form submission
        if (selectedFiles.length > 0) {
          imageIds = await Promise.all(
            selectedFiles.map(async (file) => {
              const storedFile = await storageServices.images.createFile(file);
              return storedFile.$id; // Store the image ID
            })
          );
        }

        // Prepare the product data to save
        const newProduct = {
          name: values.name,
          description: values.description,
          price: parseFloat(values.price),
          discountPrice: values.discountPrice
            ? parseFloat(values.discountPrice)
            : null,
          stockQuantity: parseInt(values.stockQuantity),
          categoryId: values.categoryId,
          images: imageIds, // Store the uploaded image IDs
          tags: values.tags.split(",").map((tag) => tag.trim()),
          isOnSale: isOnSale,
          isWholesaleProduct: isWholesale,
          wholesalePrice: isWholesale
            ? parseFloat(values.wholesalePrice)
            : null,
        };

        // Save the product to the Appwrite Products collection
        await db.Products.create(newProduct);
        navigate("/apps-ecommerce-products");
      } catch (error) {
        console.error("Failed to create product:", error);
      }
    },
  });

  return (
    <div className="page-content">
      <Container fluid>
        <h3>Create Product</h3>
        <Row>
          <Col lg={8}>
            <Form onSubmit={validation.handleSubmit}>
              <Card>
                <CardBody>
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
                      value={validation.values.name || ""}
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

              {/* General Info (Price, Stock, and Category) */}
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">General Info</h5>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col lg={6}>
                      <div className="mb-3">
                        <Label className="form-label">Price</Label>
                        <Input
                          type="number"
                          className="form-control"
                          name="price"
                          placeholder="Enter price"
                          value={validation.values.price || ""}
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
                        <Label className="form-label">Stock Quantity</Label>
                        <Input
                          type="number"
                          className="form-control"
                          name="stockQuantity"
                          placeholder="Enter stock quantity"
                          value={validation.values.stockQuantity || ""}
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
                  Submit
                </Button>
              </div>
            </Form>
          </Col>

          {/* Right Side: Product Categories, Tags, On Sale, and Wholesale Options */}
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
                  placeholder="Enter tags"
                  type="text"
                  name="tags"
                  value={validation.values.tags || ""}
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
                <div className="mb-3">
                  <Label htmlFor="discountPrice">Discount Price </Label>
                  <Input
                    type="number"
                    className="form-control"
                    id="discountPrice"
                    placeholder="Enter discount price"
                    name="discountPrice"
                    value={validation.values.discountPrice || ""}
                    onBlur={validation.handleBlur}
                    onChange={validation.handleChange}
                    disabled={!isOnSale} // Disabled when "On Sale" is off
                  />
                </div>
              </CardBody>
            </Card>

            {/* Wholesale Options Container */}
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Wholesale Options</h5>
              </CardHeader>
              <CardBody>
                <div className="form-check form-switch mb-3">
                  <Input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="isWholesaleProduct"
                    checked={isWholesale}
                    onChange={() => setIsWholesale(!isWholesale)}
                  />
                  <Label
                    className="form-check-label"
                    htmlFor="isWholesaleProduct"
                  >
                    Is Wholesale Product
                  </Label>
                </div>

                {/* Wholesale Price field enabled/disabled based on wholesale switch */}
                <div className="mb-3">
                  <Label htmlFor="wholesalePrice">Wholesale Price</Label>
                  <Input
                    type="number"
                    className="form-control"
                    id="wholesalePrice"
                    placeholder="Enter wholesale price"
                    name="wholesalePrice"
                    value={validation.values.wholesalePrice || ""}
                    onBlur={validation.handleBlur}
                    onChange={validation.handleChange}
                    disabled={!isWholesale}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EcommerceAddProduct;
