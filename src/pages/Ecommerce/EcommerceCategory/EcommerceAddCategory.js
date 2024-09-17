// src/pages/Ecommerce/EcommerceAddCategory.js

import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BreadCrumb from "../../../Components/Common/BreadCrumb";

const EcommerceAddCategory = () => {
  const navigate = useNavigate();

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
        // Create a new category in Appwrite
        await db.Categories.create(values);
        toast.success("Category added successfully");
        resetForm();
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
