// src/pages/HeroSection/HeroSectionList.js

import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Card,
  CardHeader,
  CardBody,
  Col,
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { Link } from "react-router-dom";
import db from "../../../appwrite/Services/dbServices";
import storageServices from "../../../appwrite/Services/storageServices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const HeroSectionList = () => {
  const [heroSection, setHeroSection] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state

  useEffect(() => {
    const fetchHeroSection = async () => {
      try {
        setIsLoading(true); // Start loading
        const response = await db.heroSection.list();
        let heroData = response.documents[0];

        if (!heroData) {
          // Create dummy document if none exists
          const dummyData = {
            title: "Dummy Title",
            subtitle: "Dummy Subtitle",
            imageId: "",
          };
          const newDocument = await db.heroSection.create(dummyData);
          heroData = newDocument;
          toast.success("Dummy hero section created.");
        }

        setHeroSection(heroData);
      } catch (error) {
        console.error("Failed to fetch hero section:", error);
        toast.error("Failed to fetch hero section.");
      } finally {
        setIsLoading(false); // Stop loading
      }
    };
    fetchHeroSection();
  }, []);

  // Function to get image URL
  const getImageURL = (imageId) => {
    if (!imageId) return null;
    const imageUrlResponse = storageServices.images.getFilePreview(imageId);
    return imageUrlResponse.href;
  };

  return (
    <div className="page-content">
      <ToastContainer closeButton={false} limit={1} />
      <Container fluid>
        <BreadCrumb title="Hero Section" pageTitle="Hero Section" />
        {isLoading ? (
          // Loading Indicator
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
        ) : heroSection ? (
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="d-flex align-items-center">
                  <h4 className="card-title mb-0 flex-grow-1">Hero Section</h4>
                  <div className="flex-shrink-0">
                    <Link
                      to={`/editherosection/${heroSection.$id}`}
                      className="btn btn-primary"
                    >
                      Edit Hero Section
                    </Link>
                  </div>
                </CardHeader>
                <CardBody>
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <th style={{ width: "200px" }}>Title</th>
                        <td>{heroSection.title}</td>
                      </tr>
                      <tr>
                        <th>Subtitle</th>
                        <td>{heroSection.subtitle}</td>
                      </tr>
                      <tr>
                        <th>Image</th>
                        <td>
                          {heroSection.imageId ? (
                            <img
                              src={getImageURL(heroSection.imageId)}
                              alt="Hero"
                              className="img-thumbnail"
                              style={{
                                width: "200px",
                                height: "200px",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            "No image uploaded."
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            </Col>
          </Row>
        ) : (
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
              <h5>No Hero Section Found</h5>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default HeroSectionList;
