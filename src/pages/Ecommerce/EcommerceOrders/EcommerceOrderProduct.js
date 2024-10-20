// src/components/EcommerceOrderProduct.js

import React from "react";
import { Link } from "react-router-dom";
import storageServices from "../../../appwrite/Services/storageServices"; // Adjust the path as necessary

const EcommerceOrderProduct = ({ item }) => {
  // Use productName directly
  const productName = item.productName || "N/A";

  // Use images from OrderItems
  const images = item.images || [];

  // Function to get image URL
  const getImageURL = (imageId) => {
    // Implement this based on your storage service.
    // For Appwrite's storage service, the URL might look like:
    // https://[APPWRITE_ENDPOINT]/v1/storage/buckets/[BUCKET_ID]/files/[FILE_ID]/view?project=[PROJECT_ID]
    // Adjust accordingly based on your setup.
    return storageServices.images.getFilePreview(imageId);
  };

  return (
    <tr>
      <td>
        <div className="d-flex">
          <div className="flex-shrink-0 avatar-md bg-light rounded p-1">
            <img
              src={
                images.length > 0
                  ? getImageURL(images[0])
                  : "/assets/images/products/default-product.jpg" // Ensure a default product image exists
              }
              alt={productName}
              className="img-fluid d-block"
            />
          </div>
          <div className="flex-grow-1 ms-3">
            <h5 className="fs-15">
              {item.productId ? (
                <Link
                  to={`/dashboard/products/${item.productId}`}
                  className="link-primary"
                >
                  {productName}
                </Link>
              ) : (
                <span>{productName}</span>
              )}
            </h5>
            {/* Add more details if needed, such as variant */}
          </div>
        </div>
      </td>
      <td>${parseFloat(item.price).toFixed(2)}</td>
      <td>{item.quantity}</td>
      {/* Removed "Rating" Column */}
      <td className="fw-medium text-end">
        ${ (item.price * item.quantity).toFixed(2) }
      </td>
    </tr>
  );
};

export default EcommerceOrderProduct;
