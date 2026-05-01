import { React, useEffect, useState } from "react";
import CustomInput from "../components/CustomInput";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { getProducts } from "../features/product/productSlice";
import {
  createBundle,
  getBundle,
  updateBundle,
  resetBundleState,
} from "../features/bundle/bundleSlice";
import { Select, Card, Row, Col, Button, Tag, Empty } from "antd";
import { DeleteOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";

const schema = yup.object().shape({
  title: yup.string().required("Bundle Title is Required"),
  description: yup.string().required("Description is Required"),
  bundlePrice: yup.number().required("Bundle Price is Required"),
  category: yup.string().required("Category is Required"),
});

const AddBundle = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const getBundleId = location.pathname.split("/")[3];
  const navigate = useNavigate();

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  useEffect(() => {
    if (getBundleId) {
      dispatch(resetBundleState());
      dispatch(getBundle(getBundleId));
    } else {
      dispatch(resetBundleState());
    }
  }, [getBundleId, dispatch]);

  const productState = useSelector((state) => state.product.products);
  const bundleState = useSelector((state) => state.bundle);

  const {
    isSuccess,
    isError,
    isLoading,
    createdBundle,
    updatedBundle,
    bundle,
  } = bundleState;

  // Populate form when editing
  useEffect(() => {
    if (bundle && getBundleId) {
      formik.setFieldValue("title", bundle.title);
      formik.setFieldValue("description", bundle.description);
      formik.setFieldValue("bundlePrice", bundle.bundlePrice);
      formik.setFieldValue("category", bundle.category);
      formik.setFieldValue("isActive", bundle.isActive);
      formik.setFieldValue("showOnProductPage", bundle.showOnProductPage);
      formik.setFieldValue("stock", bundle.stock);
      formik.setFieldValue("minStockWarning", bundle.minStockWarning);
      
      if (bundle.products && bundle.products.length > 0) {
        const products = bundle.products.map((item) => ({
          product: item.product?._id || item.product,
          quantity: item.quantity,
          price: item.price,
          title: item.product?.title || "Unknown Product",
        }));
        setSelectedProducts(products);
      }
      
      if (bundle.image) {
        setImagePreview(bundle.image.url);
      }
    }
  }, [bundle, getBundleId]);

  // Handle success/error
  useEffect(() => {
    if (isSuccess && createdBundle) {
      toast.success("Bundle Added Successfully!");
      navigate("/admin/list-bundle");
    }
    if (isSuccess && updatedBundle) {
      toast.success("Bundle Updated Successfully!");
      navigate("/admin/list-bundle");
    }
    if (isError) {
      toast.error("Something went wrong!");
    }
  }, [isSuccess, isError, createdBundle, updatedBundle, navigate]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: "",
      description: "",
      bundlePrice: "",
      category: "",
      isActive: true,
      showOnProductPage: false,
      stock: 0,
      minStockWarning: 5,
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      if (selectedProducts.length === 0) {
        toast.error("Please add at least one product to the bundle");
        return;
      }

      const products = selectedProducts.map((p) => ({
        product: p.product,
        quantity: p.quantity,
        price: p.price,
      }));

      const bundleData = {
        title: values.title,
        description: values.description,
        bundlePrice: values.bundlePrice,
        category: values.category,
        products,
        isActive: values.isActive,
        showOnProductPage: values.showOnProductPage,
        stock: values.stock,
        minStockWarning: values.minStockWarning,
        image: image ? { url: image } : null,
      };

      try {
        if (getBundleId) {
          await dispatch(
            updateBundle({ id: getBundleId, bundleData })
          ).unwrap();
        } else {
          await dispatch(createBundle(bundleData)).unwrap();
        }
      } catch (err) {
        toast.error("Failed to save bundle");
      }
    },
  });

  // Product selection handler
  const handleProductSelect = (productId) => {
    const product = productState.find((p) => p._id === productId);
    if (product) {
      const exists = selectedProducts.find((p) => p.product === productId);
      if (!exists) {
        setSelectedProducts([
          ...selectedProducts,
          {
            product: productId,
            quantity: 1,
            price: product.price,
            title: product.title,
          },
        ]);
      }
    }
  };

  // Remove product from bundle
  const removeProduct = (index) => {
    const updated = [...selectedProducts];
    updated.splice(index, 1);
    setSelectedProducts(updated);
  };

  // Update product quantity
  const updateQuantity = (index, quantity) => {
    const updated = [...selectedProducts];
    updated[index].quantity = quantity;
    setSelectedProducts(updated);
  };

  // Calculate totals
  const totalOriginalPrice = selectedProducts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );
  const savings = totalOriginalPrice - (formik.values.bundlePrice || 0);
  const discountPercent =
    totalOriginalPrice > 0
      ? Math.round(
          ((totalOriginalPrice - (formik.values.bundlePrice || 0)) /
            totalOriginalPrice) *
            100
        )
      : 0;

  // Product options for Select
  const productOptions = productState
    .filter((p) => !selectedProducts.find((sp) => sp.product === p._id))
    .map((p) => ({
      label: p.title,
      value: p._id,
    }));

  return (
    <div className="p-2 sm:p-4">
      <h3 className="mb-4 title">
        {getBundleId !== undefined ? "Edit" : "Add"} Bundle
      </h3>

      <form onSubmit={formik.handleSubmit}>
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            {/* Basic Info Card */}
            <Card className="mb-4" title="Bundle Details">
              <CustomInput
                type="text"
                label="Bundle Title"
                name="title"
                onChng={formik.handleChange("title")}
                onBlr={formik.handleBlur("title")}
                val={formik.values.title}
              />
              <div className="error mb-3">
                {formik.touched.title && formik.errors.title}
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="4"
                  name="description"
                  onChange={formik.handleChange("description")}
                  onBlur={formik.handleBlur("description")}
                  value={formik.values.description}
                ></textarea>
                <div className="error">
                  {formik.touched.description && formik.errors.description}
                </div>
              </div>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <CustomInput
                    type="number"
                    label="Bundle Price (₹)"
                    name="bundlePrice"
                    onChng={formik.handleChange("bundlePrice")}
                    onBlr={formik.handleBlur("bundlePrice")}
                    val={formik.values.bundlePrice}
                  />
                  <div className="error mb-3">
                    {formik.touched.bundlePrice && formik.errors.bundlePrice}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <CustomInput
                    type="text"
                    label="Category"
                    name="category"
                    onChng={formik.handleChange("category")}
                    onBlr={formik.handleBlur("category")}
                    val={formik.values.category}
                  />
                  <div className="error mb-3">
                    {formik.touched.category && formik.errors.category}
                  </div>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <CustomInput
                    type="number"
                    label="Stock Quantity"
                    name="stock"
                    onChng={formik.handleChange("stock")}
                    onBlr={formik.handleBlur("stock")}
                    val={formik.values.stock}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <CustomInput
                    type="number"
                    label="Low Stock Warning"
                    name="minStockWarning"
                    onChng={formik.handleChange("minStockWarning")}
                    onBlr={formik.handleBlur("minStockWarning")}
                    val={formik.values.minStockWarning}
                  />
                </Col>
              </Row>

              <div className="d-flex gap-3 mt-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isActive"
                    checked={formik.values.isActive}
                    onChange={(e) =>
                      formik.setFieldValue("isActive", e.target.checked)
                    }
                  />
                  <label className="form-check-label">Active</label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showOnProductPage"
                    checked={formik.values.showOnProductPage}
                    onChange={(e) =>
                      formik.setFieldValue("showOnProductPage", e.target.checked)
                    }
                  />
                  <label className="form-check-label">Show on Product Page</label>
                </div>
              </div>
            </Card>

            {/* Products Selection Card */}
            <Card
              className="mb-4"
              title={
                <span>
                  <ShoppingCartOutlined className="me-2" />
                  Products in Bundle
                </span>
              }
            >
              <Select
                className="w-100 mb-3"
                placeholder="Select products to add to bundle"
                showSearch
                optionFilterProp="label"
                onChange={handleProductSelect}
                options={productOptions}
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    {productOptions.length === 0 && (
                      <div className="p-2 text-center text-muted">
                        No more products available
                      </div>
                    )}
                  </div>
                )}
              />

              {selectedProducts.length > 0 ? (
                <div className="bundle-products">
                  {selectedProducts.map((item, index) => (
                    <div
                      key={index}
                      className="d-flex align-items-center justify-content-between p-3 mb-2"
                      style={{
                        background: "#f5f5f5",
                        borderRadius: "8px",
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold">{index + 1}.</span>
                        <div>
                          <div className="fw-medium">{item.title}</div>
                          <div className="text-muted" style={{ fontSize: "12px" }}>
                            ₹{item.price.toLocaleString()} each
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center">
                          <span className="me-2">Qty:</span>
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: "70px" }}
                            value={item.quantity}
                            min={1}
                            onChange={(e) =>
                              updateQuantity(index, parseInt(e.target.value) || 1)
                            }
                          />
                        </div>
                        <div className="fw-bold">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </div>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeProduct(index)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="No products added yet" />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            {/* Summary Card */}
            <Card className="mb-4" title="Bundle Summary">
              <div className="d-flex justify-content-between mb-2">
                <span>Original Price:</span>
                <span className="text-muted">
                  ₹{totalOriginalPrice.toLocaleString()}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Bundle Price:</span>
                <span className="fw-bold">
                  ₹{(formik.values.bundlePrice || 0).toLocaleString()}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>You Save:</span>
                <span className="text-success fw-bold">
                  ₹{savings.toLocaleString()} ({discountPercent}%)
                </span>
              </div>

              <hr />

              <div className="mb-3">
                <label className="form-label">Bundle Image URL</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter image URL or leave empty"
                  value={image || ""}
                  onChange={(e) => {
                    setImage(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                />
              </div>

              {imagePreview && (
                <div className="text-center mb-3">
                  <img
                    src={imagePreview}
                    alt="Bundle Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      borderRadius: "8px",
                    }}
                    onError={() => setImagePreview(null)}
                  />
                </div>
              )}

              <Button
                type="primary"
                htmlType="submit"
                className="w-100"
                size="large"
                loading={isLoading}
                disabled={selectedProducts.length === 0}
              >
                {getBundleId !== undefined ? "Update" : "Create"} Bundle
              </Button>
            </Card>

            {/* Quick Stats */}
            <Card title="Quick Info">
              <div className="d-flex justify-content-between mb-2">
                <span>Products:</span>
                <Tag color="blue">{selectedProducts.length}</Tag>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Status:</span>
                <Tag color={formik.values.isActive ? "green" : "red"}>
                  {formik.values.isActive ? "Active" : "Inactive"}
                </Tag>
              </div>
              <div className="d-flex justify-content-between">
                <span>Show on Product:</span>
                <Tag color={formik.values.showOnProductPage ? "purple" : "default"}>
                  {formik.values.showOnProductPage ? "Yes" : "No"}
                </Tag>
              </div>
            </Card>
          </Col>
        </Row>
      </form>

      <style>{`
        .bundle-products {
          max-height: 400px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default AddBundle;

