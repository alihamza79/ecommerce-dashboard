// src/pages/HeroSection/HeroSectionEdit.js

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
import { useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDropzone } from "react-dropzone";
import db from "../../../appwrite/Services/dbServices";
import storageServices from "../../../appwrite/Services/storageServices";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const HeroSectionEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileRejectionErrors, setFileRejectionErrors] = useState([]);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [heroData, setHeroData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state

  // Fetch hero section data
  useEffect(() => {
    const fetchHeroSection = async () => {
      try {
        setIsLoading(true); // Start loading
        const hero = await db.heroSection.get(id);
        setHeroData(hero);

        // Fetch existing image URL
        if (hero.imageId) {
          const imageUrlResponse = storageServices.images.getFilePreview(
            hero.imageId
          );
          setExistingImageUrl(imageUrlResponse.href);
        }
      } catch (error) {
        console.error("Failed to fetch hero section:", error);
        toast.error("Failed to fetch hero section data");
      } finally {
        setIsLoading(false); // Stop loading
      }
    };
    fetchHeroSection();
  }, [id]);

  // Formik validation schema
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: heroData?.title || "",
      subtitle: heroData?.subtitle || "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Please enter a title"),
      subtitle: Yup.string().required("Please enter a subtitle"),
    }),
    onSubmit: async (values) => {
      try {
        let imageId = heroData.imageId;

        // If a new image is selected
        if (selectedFile) {
          // Upload new image
          const uploadedImage = await storageServices.images.createFile(
            selectedFile
          );
          imageId = uploadedImage.$id;

          // Delete old image
          if (heroData.imageId) {
            await storageServices.images.deleteFile(heroData.imageId);
          }
        }

        const updatedHeroData = {
          title: values.title,
          subtitle: values.subtitle,
          imageId: imageId,
        };

        // Update hero section in database
        await db.heroSection.update(id, updatedHeroData);

        toast.success("Hero section updated successfully");
        navigate("/herosectionlist");
      } catch (error) {
        console.error("Error updating hero section:", error);
        toast.error("Failed to update hero section. Please try again.");
      }
    },
  });

  // Handle file upload using useDropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxSize: 5242880, // 5MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setFileRejectionErrors([]);
        setExistingImageUrl(URL.createObjectURL(acceptedFiles[0]));
      }
    },
    onDropRejected: (fileRejections) => {
      setSelectedFile(null);
      const errors = fileRejections.map((fileRejection) => {
        return fileRejection.errors.map((error) => error.message).join(", ");
      });
      setFileRejectionErrors(errors);
    },
  });

  // Show loading state
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

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} limit={1} />
      <Container fluid>
        <BreadCrumb title="Edit Hero Section" pageTitle="Hero Section" />
        <Form onSubmit={validation.handleSubmit}>
          <Row>
            <Col lg={8}>
              <Card>
                <CardBody>
                  {/* Title */}
                  <div className="mb-3">
                    <Label className="form-label" htmlFor="title-input">
                      Title <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      className="form-control"
                      id="title-input"
                      placeholder="Enter title"
                      name="title"
                      value={validation.values.title}
                      onBlur={validation.handleBlur}
                      onChange={validation.handleChange}
                      invalid={
                        validation.errors.title && validation.touched.title
                          ? true
                          : false
                      }
                    />
                    {validation.errors.title && validation.touched.title ? (
                      <FormFeedback type="invalid">
                        {validation.errors.title}
                      </FormFeedback>
                    ) : null}
                  </div>

                  {/* Subtitle */}
                  <div className="mb-3">
                    <Label className="form-label" htmlFor="subtitle-input">
                      Subtitle <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      className="form-control"
                      id="subtitle-input"
                      placeholder="Enter subtitle"
                      name="subtitle"
                      value={validation.values.subtitle}
                      onBlur={validation.handleBlur}
                      onChange={validation.handleChange}
                      invalid={
                        validation.errors.subtitle && validation.touched.subtitle
                          ? true
                          : false
                      }
                    />
                    {validation.errors.subtitle && validation.touched.subtitle ? (
                      <FormFeedback type="invalid">
                        {validation.errors.subtitle}
                      </FormFeedback>
                    ) : null}
                  </div>
                </CardBody>
              </Card>

              {/* Image Upload */}
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Hero Image</h5>
                </CardHeader>
                <CardBody>
                  <div {...getRootProps()} className="dropzone dz-clickable">
                    <input {...getInputProps()} />
                    <div className="dz-message needsclick">
                      <div className="mb-3 mt-5">
                        <i className="display-4 text-muted ri-upload-cloud-2-fill" />
                      </div>
                      <h5>Drop files here or click to upload.</h5>
                      {isDragActive && (
                        <p className="mt-2 text-primary">Drop the files here...</p>
                      )}
                      {fileRejectionErrors.length > 0 && (
                        <div className="text-danger mt-2">
                          {fileRejectionErrors.map((error, index) => (
                            <p key={index}>{error}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {existingImageUrl && (
                    <div className="mt-3">
                      <img
                        src={existingImageUrl}
                        alt="Selected"
                        className="img-thumbnail"
                        width="200"
                      />
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Submit Button */}
              <div className="text-end mb-3">
                <Button type="submit" color="success">
                  Update Hero Section
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  );
};

export default HeroSectionEdit;
