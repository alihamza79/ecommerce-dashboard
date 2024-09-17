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
import { useNavigate, useParams } from "react-router-dom";
import db from "../../../appwrite/Services/dbServices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";

const EcommerceEditCategory = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { categoryId } = params;
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
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch category:", error);
        toast.error("Failed to fetch category data");
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

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
        // Update the category in Appwrite
        await db.Categories.update(categoryId, values);
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
