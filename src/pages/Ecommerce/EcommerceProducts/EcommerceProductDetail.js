// src/pages/Ecommerce/ProductDetail/EcommerceProductDetail.jsx

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  Tooltip,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
  Badge,
} from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { Swiper, SwiperSlide } from "swiper/react";
import classnames from "classnames";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import { Link, useParams, useNavigate } from "react-router-dom";
import db from "../../../appwrite/Services/dbServices";
import storageServices from "../../../appwrite/Services/storageServices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pricing Widget Component (Displays Price, Stock, etc.)
const PricingWidgetList = ({ pricingDetails }) => {
  return (
    <Col lg={3} sm={6}>
      <div className="p-2 border border-dashed rounded">
        <div className="d-flex align-items-center">
          <div className="avatar-sm me-2">
            <div
              className={`avatar-title rounded bg-transparent text-${pricingDetails.color} fs-24`}
            >
              <i className={pricingDetails.icon}></i>
            </div>
          </div>
          <div className="flex-grow-1">
            <p className="text-muted mb-1">{pricingDetails.label} :</p>
            <h5 className="mb-0">{pricingDetails.labelDetail}</h5>
          </div>
        </div>
      </div>
    </Col>
  );
};

const EcommerceProductDetail = () => {
  const { id } = useParams(); // Get product ID from URL
  const navigate = useNavigate();

  // State variables
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [customActiveTab, setCustomActiveTab] = useState("1");
  const [tooltips, setTooltips] = useState({
    edit: false,
  });

  // Fetch product details and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product data
        const productResponse = await db.Products.get(id);
        const productData = {
          ...productResponse,
          price: parseFloat(productResponse.price),
          discountPrice: productResponse.discountPrice
            ? parseFloat(productResponse.discountPrice)
            : null,
          stockQuantity: parseInt(productResponse.stockQuantity),
          isOnSale: Boolean(productResponse.isOnSale),
          isWholesaleProduct: Boolean(productResponse.isWholesaleProduct),
          wholesalePrice: productResponse.wholesalePrice
            ? parseFloat(productResponse.wholesalePrice)
            : null,
          tags: productResponse.tags || [],
          images: productResponse.images || [],
        };
        setProduct(productData);

        // Fetch categories
        const categoryResponse = await db.Categories.list();
        setCategories(categoryResponse.documents);
      } catch (error) {
        console.error("Error fetching product details:", error);
        toast.error("Failed to load product details.");
      }
    };

    fetchData();
  }, [id]);

  // Helper function to get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.$id === categoryId);
    return category ? category.name : "Unknown";
  };

  // Helper function to get image URL
  const getImageURL = (imageId) => {
    try {
      return storageServices.images.getFilePreview(imageId);
    } catch (error) {
      console.error("Error fetching image URL:", error);
      return "/path/to/default-image.jpg"; // Replace with your default image path
    }
  };

  // Toggle active tab
  const toggleCustom = (tab) => {
    if (customActiveTab !== tab) {
      setCustomActiveTab(tab);
    }
  };

  // Handle edit navigation
  const handleEdit = () => {
    navigate(`/apps-ecommerce-edit-product/${id}`);
  };

  // Loading state
  if (!product) {
    return (
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Product Details" pageTitle="Ecommerce" />
          <div className="py-5 text-center">
            <lord-icon
              src="https://cdn.lordicon.com/msoeawqm.json"
              trigger="loop"
              colors="primary:#405189,secondary:#0ab39c"
              style={{ width: "72px", height: "72px" }}
            ></lord-icon>
            <div className="mt-4">
              <h5>Loading Product Details...</h5>
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
        <BreadCrumb title="Product Details" pageTitle="Ecommerce" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <Row className="gx-lg-5">
                  {/* Product Image Slider */}
                  <Col xl={4} md={8} className="mx-auto">
                    <div className="product-img-slider sticky-side-div">
                      <Swiper
                        navigation={true}
                        thumbs={{ swiper: thumbsSwiper }}
                        modules={[FreeMode, Navigation, Thumbs]}
                        className="swiper product-thumbnail-slider p-2 rounded bg-light"
                      >
                        {product.images && product.images.length > 0 ? (
                          product.images.map((imageId, key) => (
                            <SwiperSlide key={key}>
                              <img
                                src={getImageURL(imageId)}
                                alt={product.name}
                                className="img-fluid d-block"
                              />
                            </SwiperSlide>
                          ))
                        ) : (
                          <SwiperSlide>
                            <img
                              src="/path/to/default-image.jpg" // Replace with your default image path
                              alt="Default Product"
                              className="img-fluid d-block"
                            />
                          </SwiperSlide>
                        )}
                      </Swiper>

                      {/* Thumbnail Slider */}
                      <div className="product-nav-slider mt-2">
                        <Swiper
                          onSwiper={setThumbsSwiper}
                          slidesPerView={4}
                          freeMode={true}
                          watchSlidesProgress={true}
                          spaceBetween={10}
                          modules={[FreeMode, Navigation, Thumbs]}
                          className="swiper product-nav-slider mt-2 overflow-hidden"
                        >
                          {product.images && product.images.length > 0 ? (
                            product.images.map((imageId, key) => (
                              <SwiperSlide key={key} className="rounded">
                                <div className="nav-slide-item">
                                  <img
                                    src={getImageURL(imageId)}
                                    alt={`${product.name} Thumbnail ${key + 1}`}
                                    className="img-fluid d-block rounded"
                                  />
                                </div>
                              </SwiperSlide>
                            ))
                          ) : (
                            <SwiperSlide className="rounded">
                              <div className="nav-slide-item">
                                <img
                                  src="/path/to/default-image.jpg" // Replace with your default image path
                                  alt="Default Thumbnail"
                                  className="img-fluid d-block rounded"
                                />
                              </div>
                            </SwiperSlide>
                          )}
                        </Swiper>
                      </div>
                    </div>
                  </Col>

                  {/* Product Details */}
                  <Col xl={8}>
                    <div className="mt-xl-0 mt-5">
                      <div className="d-flex">
                        <div className="flex-grow-1">
                          <h4>{product.name}</h4>
                        </div>
                        <div className="flex-shrink-0">
                          <Tooltip
                            placement="top"
                            isOpen={tooltips.edit}
                            target="TooltipEdit"
                            toggle={() =>
                              setTooltips((prev) => ({
                                ...prev,
                                edit: !prev.edit,
                              }))
                            }
                          >
                            Edit
                          </Tooltip>
                          <button
                            id="TooltipEdit"
                            className="btn btn-light"
                            onClick={handleEdit}
                          >
                            <i className="ri-pencil-fill align-bottom"></i>
                          </button>
                        </div>
                      </div>

                      {/* Pricing and Stock Info */}
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
                        <div className="text-muted fs-16">
                          {/* Display stars based on averageRating */}
                          {product.averageRating && (
                            <>
                              {Array.from({ length: 5 }, (_, index) => (
                                <i
                                  key={index}
                                  className={
                                    index < Math.floor(product.averageRating)
                                      ? "mdi mdi-star text-warning"
                                      : index < product.averageRating
                                      ? "mdi mdi-star-half text-warning"
                                      : "mdi mdi-star-outline text-warning"
                                  }
                                ></i>
                              ))}
                            </>
                          )}
                        </div>
                        <div className="text-muted">
                          ({product.ratingsCount || 0} Customer Review
                          {product.ratingsCount > 1 ? "s" : ""})
                        </div>
                      </div>

                      {/* Pricing Widgets */}
                      <Row className="mt-4">
                        {/* Price */}
                        <PricingWidgetList
                          pricingDetails={{
                            icon: "ri-price-tag-line",
                            label: "Price",
                            labelDetail: `$${product.price.toFixed(2)}`,
                            color: "success",
                          }}
                        />
                        {/* Discount Price */}
                        {product.discountPrice && (
                          <PricingWidgetList
                            pricingDetails={{
                              icon: "ri-price-tag-3-line",
                              label: "Discount",
                              labelDetail: `$${product.discountPrice.toFixed(2)}`,
                              color: "danger",
                            }}
                          />
                        )}
                        {/* Stock Quantity */}
                        <PricingWidgetList
                          pricingDetails={{
                            icon: "ri-archive-line",
                            label: "Stock",
                            labelDetail: product.stockQuantity,
                            color: "info",
                          }}
                        />
                        {/* On Sale Status */}
                        <PricingWidgetList
                          pricingDetails={{
                            icon: "ri-percent-line",
                            label: "On Sale",
                            labelDetail: product.isOnSale ? "Yes" : "No",
                            color: product.isOnSale ? "warning" : "secondary",
                          }}
                        />
                        {/* Wholesale Status */}
                        <PricingWidgetList
                          pricingDetails={{
                            icon: "ri-store-line",
                            label: "Wholesale",
                            labelDetail: product.isWholesaleProduct
                              ? "Available"
                              : "Not Available",
                            color: product.isWholesaleProduct
                              ? "primary"
                              : "secondary",
                          }}
                        />
                        {/* Wholesale Price */}
                        {product.isWholesaleProduct && product.wholesalePrice && (
                          <PricingWidgetList
                            pricingDetails={{
                              icon: "ri-money-dollar-circle-line",
                              label: "Wholesale Price",
                              labelDetail: `$${product.wholesalePrice.toFixed(2)}`,
                              color: "primary",
                            }}
                          />
                        )}
                      </Row>

                      {/* Tags */}
                      <div className="mt-4">
                        <h5 className="fs-14">Tags:</h5>
                        <div className="d-flex flex-wrap gap-2">
                          {product.tags && product.tags.length > 0 ? (
                            product.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                color="secondary"
                                className="fs-12"
                              >
                                {tag.trim()}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted">
                              No tags available.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mt-4 text-muted">
                        <h5 className="fs-14">Description:</h5>
                        <p
                          dangerouslySetInnerHTML={{
                            __html: product.description,
                          }}
                        ></p>
                      </div>

                      {/* Detailed Description Tabs */}
                      <div className="product-content mt-5">
                        <h5 className="fs-14 mb-3">Product Details:</h5>
                        <Nav tabs className="nav-tabs-custom nav-success">
                          <NavItem>
                            <NavLink
                              style={{ cursor: "pointer" }}
                              className={classnames({
                                active: customActiveTab === "1",
                              })}
                              onClick={() => {
                                toggleCustom("1");
                              }}
                            >
                              Specification
                            </NavLink>
                          </NavItem>
                          <NavItem>
                            <NavLink
                              style={{ cursor: "pointer" }}
                              className={classnames({
                                active: customActiveTab === "2",
                              })}
                              onClick={() => {
                                toggleCustom("2");
                              }}
                            >
                              Additional Details
                            </NavLink>
                          </NavItem>
                        </Nav>

                        <TabContent
                          activeTab={customActiveTab}
                          className="border border-top-0 p-4"
                          id="nav-tabContent"
                        >
                          <TabPane id="nav-speci" tabId="1">
                            <div className="table-responsive">
                              <table className="table mb-0">
                                <tbody>
                                  <tr>
                                    <th scope="row" style={{ width: "200px" }}>
                                      Category
                                    </th>
                                    <td>{getCategoryName(product.categoryId)}</td>
                                  </tr>
                                  <tr>
                                    <th scope="row">Price</th>
                                    <td>${product.price.toFixed(2)}</td>
                                  </tr>
                                  {product.discountPrice && (
                                    <tr>
                                      <th scope="row">Discount Price</th>
                                      <td>${product.discountPrice.toFixed(2)}</td>
                                    </tr>
                                  )}
                                  <tr>
                                    <th scope="row">Stock Quantity</th>
                                    <td>{product.stockQuantity}</td>
                                  </tr>
                                  <tr>
                                    <th scope="row">On Sale</th>
                                    <td>{product.isOnSale ? "Yes" : "No"}</td>
                                  </tr>
                                  <tr>
                                    <th scope="row">Wholesale</th>
                                    <td>
                                      {product.isWholesaleProduct
                                        ? "Available"
                                        : "Not Available"}
                                    </td>
                                  </tr>
                                  {product.isWholesaleProduct &&
                                    product.wholesalePrice && (
                                      <tr>
                                        <th scope="row">Wholesale Price</th>
                                        <td>${product.wholesalePrice.toFixed(2)}</td>
                                      </tr>
                                    )}
                                  <tr>
                                    <th scope="row">Tags</th>
                                    <td>
                                      {product.tags && product.tags.length > 0 ? (
                                        product.tags.join(", ")
                                      ) : (
                                        "No tags available."
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </TabPane>
                          <TabPane id="nav-detail" tabId="2">
                            <div>
                              <h5 className="font-size-16 mb-3">{product.name}</h5>
                              <p
                                dangerouslySetInnerHTML={{
                                  __html: product.description,
                                }}
                              ></p>
                              {/* Additional Details can be added here if available */}
                            </div>
                          </TabPane>
                        </TabContent>
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EcommerceProductDetail;