import { React, useEffect, useState, useRef } from "react";
import CustomInput from "../components/CustomInput";
import ReactQuill from "react-quill";
import { useLocation, useNavigate } from "react-router-dom";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { getBrands } from "../features/brand/brandSlice";
import { getCategories } from "../features/pcategory/pcategorySlice";
import { getColors } from "../features/color/colorSlice";
import { Select, Modal, Card, Input, Button } from "antd";
import { getSizes } from "../features/size/sizeSlice";
import Dropzone from "react-dropzone";
import { clearUploads } from "../features/upload/uploadSlice";
import JsBarcode from "jsbarcode";
import { FaEye, FaDownload, FaPlus, FaMinus, FaTrash, FaImage, FaVideo } from "react-icons/fa";
import { MdPrint, MdInventory, MdCategory, MdColorLens, MdAttachMoney } from "react-icons/md";
import BarcodeModal from "../components/BarcodeModal";
import AIProductGenerator from "../components/AIProductGenerator";
import QuickAddModal from "../components/QuickAddModal";

import {
  uploadImg,
  uploadVideo,
  delImg,
  delVideo,
} from "../features/upload/uploadSlice";

import {
  createProducts,
  getAProduct,
  resetState,
  updateAProduct,
} from "../features/product/productSlice";

let schema = yup.object().shape({
  title: yup.string().required("Title is Required"),
  description: yup.string().required("Description is Required"),
  price: yup.number().required("Price is Required"),
  brand: yup.string().required("Brand is Required"),
  category: yup.string().required("Category is Required"),
  tags: yup.string().required("Tag is Required"),
  hsnCode: yup.string().matches(/^[0-9]{4,8}$/, "HSN must be 4-8 digits").optional(),
  color: yup.string().when("variants", function(variants) {
    return !Array.isArray(variants) || variants.length === 0
      ? yup.string().required("Color is Required when no variants are set")
      : yup.string().notRequired();
  }),
  variants: yup.array().of(
    yup.object().shape({
      color: yup.string().required("Color is required for variant"),
      sizeStock: yup.array().of(
        yup.object().shape({
          size: yup.string().required("Size is required"),
          quantity: yup.number().min(0, "Quantity must be 0 or more").required("Quantity is required"),
          barcode: yup.string().optional(),
        })
      ).min(1, "At least one size is required for variant"),
    })
  ).optional(),
  inventory: yup.object({
    offline: yup.boolean().oneOf([true]),
    online: yup.boolean(),
  }),
  videos: yup.array().optional(),
});

const Addproduct = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const getProductId = location.pathname.split("/")[3];
  const navigate = useNavigate();
  const [color, setColor] = useState([]);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [previewBarcode, setPreviewBarcode] = useState("");
  
  // Modal state for barcode view
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [selectedBarcodeTitle, setSelectedBarcodeTitle] = useState("");
  const [quickAddModal, setQuickAddModal] = useState(null); // "color" | "brand" | "category" | null
  const generatedBarcodesRef = useRef(new Set());

  // Client-side preview barcode generator: PRD-XXXXXXXX (8 uppercase hex chars)
  const generateClientBarcode = (takenBarcodes = []) => {
    const taken = new Set([
      ...Array.from(generatedBarcodesRef.current),
      ...takenBarcodes.filter(Boolean),
    ]);

    const randomHex8 = () => {
      if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
        const bytes = new Uint8Array(4);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();
      }
      return Math.floor(Math.random() * 0xffffffff)
        .toString(16)
        .padStart(8, "0")
        .toUpperCase();
    };

    let code = `PRD-${randomHex8()}`;
    let guard = 0;
    while (taken.has(code) && guard < 20) {
      code = `PRD-${randomHex8()}`;
      guard += 1;
    }

    generatedBarcodesRef.current.add(code);
    return code;
  };

  useEffect(() => {
    dispatch(getBrands());
    dispatch(getCategories());
    dispatch(getColors());
    dispatch(getSizes());
  }, []);

  const brandState = useSelector((state) => state.brand.brands);
  const catState = useSelector((state) => state.pCategory.pCategories);
  const colorState = useSelector((state) => state.color.colors);
  const sizeState = useSelector((state) => state.size.sizes);
  const imgState = useSelector((state) => state?.upload?.images);
  const newProduct = useSelector((state) => state.product);
  const {
    isSuccess,
    isError,
    isLoading,
    createdProduct,
    updatedProduct,
    productName,
    productDesc,
    productPrice,
    productBrand,
    productCategory,
    productTag,
    productColors,
    productSize,
    productQuantity,
    productImages,
    productVideos,
    subcategory: productSubcategory,
    short_description: productShortDesc,
    highlights: productHighlights,
    search_keywords: productSearchKeywords,
    mrp: productMrp,
    discount_percentage: productDiscount,
    sku: productSku,
    min_stock_alert: productMinStock,
    attributes: productAttributes,
    seo: productSeo,
    shipping: productShipping,
  } = newProduct;

  const videoState = useSelector((state) => state?.upload?.videos);

  useEffect(() => {
    if (getProductId !== undefined) {
      dispatch(resetState());
      dispatch(getAProduct(getProductId));
    } else {
      dispatch(resetState());
    }
  }, [getProductId]);

  const coloropt = [];
  colorState.forEach((i) => {
    coloropt.push({
      label: (
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: i.title,
              borderRadius: "50%",
              border: "2px solid #fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          />
          <span>{i.title}</span>
        </div>
      ),
      value: i._id,
    });
  });

  const vid = [];
  videoState?.forEach((v) => {
    vid.push({
      public_id: v.public_id,
      url: v.url,
    });
  });

  const img = [];
  imgState?.forEach((i) => {
    img.push({
      public_id: i.public_id,
      url: i.url,
    });
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: productName || "",
      description: productDesc || "",
      price: productPrice || "",
      brand: productBrand || "",
      category: productCategory || "",
      tags: productTag || "",
      hsnCode: newProduct?.hsnCode || newProduct?.productHsn || "",
      subcategory: productSubcategory || "",
      short_description: productShortDesc || "",
      highlights: productHighlights || [],
      search_keywords: productSearchKeywords || [],
      mrp: productMrp || "",
      discount_percentage: productDiscount || "",
      sku: productSku || "",
      min_stock_alert: productMinStock ?? 5,
      attributes: productAttributes || { material: "", pattern: "", fit: "", occasion: "", gender: "", age_group: "" },
      seo: productSeo || { meta_title: "", meta_description: "", meta_keywords: [] },
      shipping: productShipping || { weight: "", dimensions: "", is_fragile: false },
      color: productColors?._id || productColors || undefined,
      sizeStock: newProduct?.sizeStock?.map((s) => ({
        size: s.size,
        quantity: s.quantity,
        barcode: s.barcode || generateClientBarcode(),
      })) || [],
      variants:
        newProduct?.variants?.map((variant) => ({
          color: variant.color?._id || variant.color,
          sizeStock: (variant.sizeStock || []).map((item) => ({
            size: item.size,
            quantity: item.quantity,
            barcode: item.barcode || generateClientBarcode(),
          })),
        })) || [],
      inventory: {
        offline: true,
        online: newProduct?.inventory?.online ?? false,
      },
      images: productImages || "",
      videos: productVideos || [],
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      const normalizeSizeStock = (stock) =>
        (Array.isArray(stock) ? stock : []).map((item) => ({
          ...item,
          quantity: Math.max(0, Number(item.quantity) || 0),
          barcode:
            item.barcode && /^PRD-[A-F0-9]{8}$/.test(item.barcode)
              ? item.barcode
              : generateClientBarcode(
                  (values.sizeStock || []).map((s) => s.barcode)
                ),
        }));

      const normalizedSizeStock = normalizeSizeStock(values.sizeStock);
      const normalizedVariants = (Array.isArray(values.variants) ? values.variants : []).map(
        (variant) => {
          const cleaned = {
            color: variant.color,
            sizeStock: normalizeSizeStock(variant.sizeStock),
          };
          return cleaned;
        }
      );

      const totalQuantity = normalizedVariants.length > 0
        ? normalizedVariants.reduce(
            (sum, variant) =>
              sum + variant.sizeStock.reduce((sn, item) => sn + Number(item.quantity || 0), 0),
            0
          )
        : normalizedSizeStock.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      const payload = {
        ...values,
        sizeStock: normalizedVariants.length > 0 ? [] : normalizedSizeStock,
        variants: normalizedVariants,
        color:
          normalizedVariants.length > 0
            ? normalizedVariants[0].color
            : values.color,
        quantity: totalQuantity,
        inventory: {
          offline: true,
          ...(values.inventory.online ? { online: true } : {}),
        },
      };

      try {
        if (getProductId) {
          await dispatch(
            updateAProduct({ id: getProductId, productData: payload }),
          ).unwrap();
          toast.success("Product Updated Successfully!");
          navigate("/admin/list-product");
        } else {
          await dispatch(createProducts(payload)).unwrap();
          toast.success("Product Added Successfully!");
          formik.resetForm();
          dispatch(resetState());
          dispatch(delImg());
          dispatch(delVideo());
          dispatch(clearUploads());
          navigate("/admin/list-product");
        }
      } catch (err) {
        toast.error("Something went wrong");
      }
    },
  });

  const handleColors = (e) => {
    setColor(e);
    formik.setFieldValue("color", e);
  };

  useEffect(() => {
    if (getProductId) {
      if (imgState.length > 0) {
        formik.setFieldValue("images", imgState);
      } else if (productImages) {
        formik.setFieldValue("images", productImages);
      }
    } else {
      formik.setFieldValue("images", imgState);
    }

    if (getProductId) {
      if (videoState.length > 0) {
        formik.setFieldValue("videos", videoState);
      } else if (productVideos) {
        formik.setFieldValue("videos", productVideos);
      }
    } else {
      formik.setFieldValue("videos", videoState);
    }
  }, [imgState, videoState, productImages, productVideos, getProductId]);

  useEffect(() => {
    if (getProductId && newProduct.inventory) {
      formik.setFieldValue("inventory", {
        offline: true,
        online: newProduct.inventory.online ?? false,
      });
    }
  }, [getProductId, newProduct.inventory]);

  useEffect(() => {
    if (formik.values.title) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      setPreviewBarcode(`PRD-${random}`);
    } else {
      setPreviewBarcode("");
    }
  }, [formik.values.title]);

  const updateSizeQuantity = (index, nextQuantity) => {
    const safeQty = Math.max(0, Number(nextQuantity) || 0);
    const updated = [...formik.values.sizeStock];
    if (!updated[index]) return;
    updated[index] = { ...updated[index], quantity: safeQty };
    formik.setFieldValue("sizeStock", updated);
  };

  const addVariant = () => {
    const current = formik.values.variants || [];
    formik.setFieldValue("variants", [
      ...current,
      { color: "", sizeStock: [] },
    ]);
  };

  const removeVariant = (variantIndex) => {
    const updated = (formik.values.variants || []).filter((_, idx) => idx !== variantIndex);
    formik.setFieldValue("variants", updated);
  };

  const setVariantColor = (variantIndex, colorValue) => {
    const updated = [...(formik.values.variants || [])];
    updated[variantIndex] = {
      ...updated[variantIndex],
      color: colorValue,
    };
    formik.setFieldValue("variants", updated);
  };

  const setVariantSizes = (variantIndex, selectedSizes) => {
    const variants = [...(formik.values.variants || [])];
    const currentVariant = variants[variantIndex] || { color: "", sizeStock: [] };
    const existing = currentVariant.sizeStock || [];
    const updatedSizeStock = selectedSizes.map((size) => {
      const found = existing.find((s) => s.size === size);
      if (found) return found;
      return {
        size,
        quantity: 0,
        barcode: generateClientBarcode(existing.map((s) => s.barcode)),
      };
    });
    variants[variantIndex] = { ...currentVariant, sizeStock: updatedSizeStock };
    formik.setFieldValue("variants", variants);
  };

  const updateVariantSizeQuantity = (variantIndex, sizeIndex, nextQuantity) => {
    const safeQty = Math.max(0, Number(nextQuantity) || 0);
    const variants = [...(formik.values.variants || [])];
    if (!variants[variantIndex]) return;
    const sizeStock = [...(variants[variantIndex].sizeStock || [])];
    if (!sizeStock[sizeIndex]) return;
    sizeStock[sizeIndex] = { ...sizeStock[sizeIndex], quantity: safeQty };
    variants[variantIndex] = { ...variants[variantIndex], sizeStock };
    formik.setFieldValue("variants", variants);
  };

  return (
    <div className="add-product-page" style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", padding: "24px" }}>
      {/* Header Section */}
      <Card
        style={{
          borderRadius: "12px",
          border: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}
        bodyStyle={{ padding: "20px 24px" }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h2 className="mb-1" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "24px" }}>
              {getProductId !== undefined ? "Edit" : "Add"} Product
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
              {getProductId !== undefined ? "Update product details and inventory" : "Add a new product to your inventory"}
            </p>
          </div>
          <div className="d-flex gap-3">
            <AIProductGenerator
              onGenerated={(data) => {
                if (data.name) formik.setFieldValue("title", data.name);
                if (data.description) formik.setFieldValue("description", data.description);
                if (data.pricing?.selling_price) formik.setFieldValue("price", data.pricing.selling_price);
                if (data.brand) formik.setFieldValue("brand", data.brand);
                if (data.category) formik.setFieldValue("category", data.category);
                if (data.tags?.length) {
                  const tagMap = { featured: "featured", popular: "popular", special: "special" };
                  const matched = data.tags.find((t) => tagMap[t?.toLowerCase()]);
                  if (matched) formik.setFieldValue("tags", matched.toLowerCase());
                }
                if (data.subcategory) formik.setFieldValue("subcategory", data.subcategory);
                if (data.short_description) formik.setFieldValue("short_description", data.short_description);
                if (data.highlights?.length) formik.setFieldValue("highlights", data.highlights);
                if (data.search_keywords?.length) formik.setFieldValue("search_keywords", data.search_keywords);
                if (data.pricing?.mrp) formik.setFieldValue("mrp", data.pricing.mrp);
                if (data.pricing?.discount_percentage) formik.setFieldValue("discount_percentage", data.pricing.discount_percentage);
                if (data.inventory?.sku) formik.setFieldValue("sku", data.inventory.sku);
                if (data.inventory?.min_stock_alert) formik.setFieldValue("min_stock_alert", data.inventory.min_stock_alert);
                if (data.attributes) {
                  formik.setFieldValue("attributes", {
                    material: data.attributes.material || "",
                    pattern: data.attributes.pattern || "",
                    fit: data.attributes.fit || "",
                    occasion: data.attributes.occasion || "",
                    gender: data.attributes.gender || "",
                    age_group: data.attributes.age_group || "",
                  });
                }
                if (data.seo) {
                  formik.setFieldValue("seo", {
                    meta_title: data.seo.meta_title || "",
                    meta_description: data.seo.meta_description || "",
                    meta_keywords: data.seo.meta_keywords || [],
                  });
                }
                if (data.shipping) {
                  formik.setFieldValue("shipping", {
                    weight: data.shipping.weight || "",
                    dimensions: data.shipping.dimensions || "",
                    is_fragile: data.shipping.is_fragile || false,
                  });
                }
              }}
            />
            <Button
              onClick={() => navigate("/admin/list-product")}
              style={{
                height: "40px",
                borderRadius: "8px",
                fontWeight: 500,
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={formik.handleSubmit}
              loading={isLoading}
              style={{
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "#1890ff",
                border: "none",
                fontWeight: 500,
              }}
            >
              {getProductId !== undefined ? "Update" : "Add"} Product
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Form Grid */}
      <div className="row g-4">
        {/* Left Column - Main Product Info */}
        <div className="col-lg-8">
          {/* Basic Info Card */}
          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              marginBottom: "24px",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <MdInventory style={{ fontSize: "20px", color: "#1890ff" }} />
              <h4 className="mb-0" style={{ fontWeight: 600 }}>Basic Information</h4>
            </div>
            
            <form onSubmit={formik.handleSubmit}>
              <div className="mb-4">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>
                  Product Title <span className="text-danger">*</span>
                </label>
                <Input
                  size="large"
                  placeholder="Enter product title"
                  name="title"
                  value={formik.values.title}
                  onChange={formik.handleChange("title")}
                  onBlur={formik.handleBlur("title")}
                  style={{
                    borderRadius: "8px",
                    border: formik.touched.title && formik.errors.title ? "1px solid #ff4d4f" : "1px solid #d9d9d9",
                  }}
                />
                {formik.touched.title && formik.errors.title && (
                  <span className="text-danger" style={{ fontSize: "12px" }}>{formik.errors.title}</span>
                )}
              </div>

              <div className="mb-4">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>
                  Short Description
                </label>
                <Input.TextArea
                  rows={2}
                  placeholder="Brief product summary (shown in listings)"
                  name="short_description"
                  value={formik.values.short_description}
                  onChange={formik.handleChange("short_description")}
                  style={{ borderRadius: "8px" }}
                />
              </div>

              <div className="mb-4">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>
                  Description <span className="text-danger">*</span>
                </label>
                <div style={{ 
                  borderRadius: "8px", 
                  border: formik.touched.description && formik.errors.description ? "1px solid #ff4d4f" : "1px solid #d9d9d9",
                  overflow: "hidden"
                }}>
                  <ReactQuill
                    theme="snow"
                    name="description"
                    onChange={(value) => formik.setFieldValue("description", value)}
                    value={formik.values.description}
                    style={{ height: "150px", marginBottom: "50px" }}
                  />
                </div>
                {formik.touched.description && formik.errors.description && (
                  <span className="text-danger" style={{ fontSize: "12px" }}>{formik.errors.description}</span>
                )}
              </div>

              <div className="mb-4">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>HSN Code</label>
                <Input
                  size="large"
                  placeholder="Enter HSN code (4-8 digits)"
                  name="hsnCode"
                  value={formik.values.hsnCode}
                  onChange={formik.handleChange("hsnCode")}
                  onBlur={formik.handleBlur("hsnCode")}
                  style={{ borderRadius: "8px", border: formik.touched.hsnCode && formik.errors.hsnCode ? "1px solid #ff4d4f" : "1px solid #d9d9d9" }}
                />
                {formik.touched.hsnCode && formik.errors.hsnCode && (
                  <span className="text-danger" style={{ fontSize: "12px" }}>{formik.errors.hsnCode}</span>
                )}
              </div>

              <div className="mb-4">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>
                  Highlights
                </label>
                {(formik.values.highlights || []).map((h, i) => (
                  <div key={i} className="d-flex gap-2 mb-2">
                    <Input
                      value={h}
                      placeholder={`Highlight ${i + 1}`}
                      onChange={(e) => {
                        const updated = [...formik.values.highlights];
                        updated[i] = e.target.value;
                        formik.setFieldValue("highlights", updated);
                      }}
                      style={{ borderRadius: "8px" }}
                    />
                    <Button danger type="text" onClick={() => {
                      const updated = formik.values.highlights.filter((_, idx) => idx !== i);
                      formik.setFieldValue("highlights", updated);
                    }}>✕</Button>
                  </div>
                ))}
                <Button type="dashed" size="small" onClick={() => formik.setFieldValue("highlights", [...(formik.values.highlights || []), ""])}>
                  + Add Highlight
                </Button>
              </div>

              <div className="mb-0">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>
                  Search Keywords
                </label>
                <Select
                  mode="tags"
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Type keyword and press Enter"
                  value={formik.values.search_keywords || []}
                  onChange={(val) => formik.setFieldValue("search_keywords", val)}
                />
              </div>
            </form>
          </Card>

          {/* Pricing Card */}
          <Card
            style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "24px" }}
            bodyStyle={{ padding: "24px" }}
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <MdAttachMoney style={{ fontSize: "20px", color: "#52c41a" }} />
              <h4 className="mb-0" style={{ fontWeight: 600 }}>Pricing</h4>
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>Selling Price <span className="text-danger">*</span></label>
                <Input size="large" type="number" prefix="₹" placeholder="799" name="price"
                  value={formik.values.price} onChange={formik.handleChange("price")} onBlur={formik.handleBlur("price")}
                  style={{ borderRadius: "8px", border: formik.touched.price && formik.errors.price ? "1px solid #ff4d4f" : "1px solid #d9d9d9" }}
                />
                {formik.touched.price && formik.errors.price && <span className="text-danger" style={{ fontSize: "12px" }}>{formik.errors.price}</span>}
              </div>
              <div className="col-md-4">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>MRP</label>
                <Input size="large" type="number" prefix="₹" placeholder="1299" name="mrp"
                  value={formik.values.mrp} onChange={formik.handleChange("mrp")}
                  style={{ borderRadius: "8px" }}
                />
              </div>
              <div className="col-md-4">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>Discount %</label>
                <Input size="large" type="number" suffix="%" placeholder="38" name="discount_percentage"
                  value={formik.values.discount_percentage} onChange={formik.handleChange("discount_percentage")}
                  style={{ borderRadius: "8px" }}
                />
              </div>
            </div>
          </Card>

          {/* Category & Brand Card */}
          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              marginBottom: "24px",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <MdCategory style={{ fontSize: "20px", color: "#722ed1" }} />
              <h4 className="mb-0" style={{ fontWeight: 600 }}>Category & Brand</h4>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="fw-medium mb-0" style={{ color: "#1a1a1a" }}>Brand <span className="text-danger">*</span></label>
                  <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => setQuickAddModal("brand")}>+ Add New</Button>
                </div>
                <Select
                  showSearch
                  size="large"
                  placeholder="Select Brand"
                  optionFilterProp="children"
                  style={{ width: "100%" }}
                  value={formik.values.brand || undefined}
                  onChange={(value) => formik.setFieldValue("brand", value)}
                  onBlur={formik.handleBlur("brand")}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={brandState.map((i) => ({
                    label: i.title,
                    value: i.title,
                  }))}
                />
                {formik.touched.brand && formik.errors.brand && (
                  <span className="text-danger" style={{ fontSize: "12px" }}>{formik.errors.brand}</span>
                )}
              </div>

              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="fw-medium mb-0" style={{ color: "#1a1a1a" }}>Category <span className="text-danger">*</span></label>
                  <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => setQuickAddModal("category")}>+ Add New</Button>
                </div>
                <Select
                  showSearch
                  size="large"
                  placeholder="Select Category"
                  optionFilterProp="children"
                  style={{ width: "100%" }}
                  value={formik.values.category || undefined}
                  onChange={(value) => formik.setFieldValue("category", value)}
                  onBlur={formik.handleBlur("category")}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={catState.map((i) => ({
                    label: i.title,
                    value: i.title,
                  }))}
                />
                {formik.touched.category && formik.errors.category && (
                  <span className="text-danger" style={{ fontSize: "12px" }}>{formik.errors.category}</span>
                )}
              </div>

              <div className="col-md-6">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>Subcategory</label>
                <Input size="large" placeholder="e.g. T-Shirts" name="subcategory"
                  value={formik.values.subcategory} onChange={formik.handleChange("subcategory")}
                  style={{ borderRadius: "8px" }}
                />
              </div>

              <div className="col-md-6">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>
                  Tags <span className="text-danger">*</span>
                </label>
                <Select
                  size="large"
                  placeholder="Select Tag"
                  style={{ width: "100%" }}
                  value={formik.values.tags || undefined}
                  onChange={(value) => formik.setFieldValue("tags", value)}
                  onBlur={formik.handleBlur("tags")}
                  options={[
                    { label: "Featured", value: "featured" },
                    { label: "Popular", value: "popular" },
                    { label: "Special", value: "special" },
                  ]}
                />
                {formik.touched.tags && formik.errors.tags && (
                  <span className="text-danger" style={{ fontSize: "12px" }}>{formik.errors.tags}</span>
                )}
              </div>


            </div>
          </Card>

          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              marginBottom: "24px",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <MdInventory style={{ fontSize: "20px", color: "#52c41a" }} />
              <h4 className="mb-0" style={{ fontWeight: 600 }}>Color Variants</h4>
            </div>

            <p className="text-muted" style={{ fontSize: "14px" }}>
              Add multiple color variants; each variant can have its own size and stock values.
            </p>

            <Button type="dashed" onClick={addVariant} style={{ marginBottom: "16px" }}>
              + Add Variant
            </Button>

            {(formik.values.variants || []).map((variant, variantIndex) => (
              <Card
                key={`variant-${variantIndex}`}
                size="small"
                style={{ marginBottom: "16px", border: "1px solid #e0e0e0" }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div style={{ fontWeight: 600 }}>Variant #{variantIndex + 1}</div>
                  <Button danger type="text" onClick={() => removeVariant(variantIndex)}>
                    Remove
                  </Button>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="fw-medium mb-0" style={{ color: "#1a1a1a" }}>Color</label>
                      <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => setQuickAddModal("color")}>+ Add New</Button>
                    </div>
                    <Select
                      showSearch
                      size="large"
                      placeholder="Select variant color"
                      style={{ width: "100%" }}
                      value={variant.color || undefined}
                      onChange={(value) => setVariantColor(variantIndex, value)}
                      options={coloropt}
                    />
                  </div>

                      <div className="col-md-6">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="fw-medium mb-0" style={{ color: "#1a1a1a" }}>Sizes</label>
                      <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => setQuickAddModal("size")}>+ Add New</Button>
                    </div>
                    <Select
                      mode="multiple"
                      allowClear
                      size="large"
                      placeholder="Select sizes for variant"
                      style={{ width: "100%" }}
                      value={(variant.sizeStock || []).map((s) => s.size)}
                      onChange={(selectedSizes) => setVariantSizes(variantIndex, selectedSizes)}
                      options={sizeState.map((s) => ({ label: s.title, value: s.title }))}
                    />
                  </div>
                </div>

                {(variant.sizeStock || []).length > 0 && (
                  <div className="table-responsive" style={{ marginTop: "16px" }}>
                    <table className="table" style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #f0f0f0" }}>
                      <thead style={{ backgroundColor: "#fafafa" }}>
                        <tr>
                          <th>#</th>
                          <th>Size</th>
                          <th>Quantity</th>
                          <th>Barcode</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(variant.sizeStock || []).map((item, sizeIndex) => (
                          <tr key={`${variantIndex}-${item.size}`}>
                            <td>{sizeIndex + 1}</td>
                            <td>{item.size}</td>
                            <td>
                              <Input
                                type="number"
                                min={0}
                                value={item.quantity}
                                onChange={(e) => updateVariantSizeQuantity(variantIndex, sizeIndex, e.target.value)}
                                style={{ width: "100px" }}
                              />
                            </td>
                            <td style={{ fontSize: "11px", fontFamily: "monospace", color: "#555" }}>
                              {item.barcode || "-"}
                            </td>
                            <td>
                              {item.barcode && (
                                <Button
                                  size="small"
                                  type="primary"
                                  style={{ backgroundColor: "#722ed1", borderColor: "#722ed1", fontSize: "11px" }}
                                  onClick={() => {
                                    setSelectedBarcode(item.barcode);
                                    setSelectedBarcodeTitle(`${formik.values.title} - ${item.size}`);
                                    setBarcodeModalOpen(true);
                                  }}
                                >
                                  🏷️ Print
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ))}
          </Card>
        

          {/* Inventory Settings Card */}
          <Card
            style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "24px" }}
            bodyStyle={{ padding: "24px" }}
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <MdInventory style={{ fontSize: "20px", color: "#fa8c16" }} />
              <h4 className="mb-0" style={{ fontWeight: 600 }}>Inventory & SKU</h4>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>SKU</label>
                <Input size="large" placeholder="e.g. TSHIRT-M-SKY-001" name="sku"
                  value={formik.values.sku} onChange={formik.handleChange("sku")}
                  style={{ borderRadius: "8px" }}
                />
              </div>
              <div className="col-md-6">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>Min Stock Alert</label>
                <Input size="large" type="number" placeholder="5" name="min_stock_alert"
                  value={formik.values.min_stock_alert} onChange={formik.handleChange("min_stock_alert")}
                  style={{ borderRadius: "8px" }}
                />
              </div>
            </div>
            <div className="d-flex gap-4">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" checked={true} disabled
                  style={{ width: "18px", height: "18px", cursor: "not-allowed" }}
                />
                <label className="form-check-label ms-2 fw-medium">Offline Store</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" name="inventory.online"
                  checked={formik.values.inventory.online}
                  onChange={(e) => formik.setFieldValue("inventory.online", e.target.checked)}
                  style={{ width: "18px", height: "18px" }}
                />
                <label className="form-check-label ms-2 fw-medium">Online Store</label>
              </div>
            </div>
          </Card>

          {/* Attributes Card */}
          <Card
            style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "24px" }}
            bodyStyle={{ padding: "24px" }}
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <MdColorLens style={{ fontSize: "20px", color: "#eb2f96" }} />
              <h4 className="mb-0" style={{ fontWeight: 600 }}>Product Attributes</h4>
            </div>
            <div className="row g-3">
              {[
                { key: "material", label: "Material", placeholder: "e.g. Cotton Blend" },
                { key: "pattern", label: "Pattern", placeholder: "e.g. Graphic Print" },
                { key: "fit", label: "Fit", placeholder: "e.g. Regular Fit" },
                { key: "occasion", label: "Occasion", placeholder: "e.g. Casual" },
                { key: "gender", label: "Gender", placeholder: "e.g. Men" },
                { key: "age_group", label: "Age Group", placeholder: "e.g. Adult" },
              ].map(({ key, label, placeholder }) => (
                <div className="col-md-6" key={key}>
                  <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>{label}</label>
                  <Input size="large" placeholder={placeholder}
                    value={formik.values.attributes?.[key] || ""}
                    onChange={(e) => formik.setFieldValue(`attributes.${key}`, e.target.value)}
                    style={{ borderRadius: "8px" }}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* SEO Card */}
          <Card
            style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "24px" }}
            bodyStyle={{ padding: "24px" }}
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <MdCategory style={{ fontSize: "20px", color: "#1890ff" }} />
              <h4 className="mb-0" style={{ fontWeight: 600 }}>SEO</h4>
            </div>
            <div className="mb-3">
              <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>Meta Title</label>
              <Input size="large" placeholder="SEO meta title"
                value={formik.values.seo?.meta_title || ""}
                onChange={(e) => formik.setFieldValue("seo.meta_title", e.target.value)}
                style={{ borderRadius: "8px" }}
              />
            </div>
            <div className="mb-3">
              <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>Meta Description</label>
              <Input.TextArea rows={2} placeholder="SEO meta description"
                value={formik.values.seo?.meta_description || ""}
                onChange={(e) => formik.setFieldValue("seo.meta_description", e.target.value)}
                style={{ borderRadius: "8px" }}
              />
            </div>
            <div>
              <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>Meta Keywords</label>
              <Select mode="tags" size="large" style={{ width: "100%" }} placeholder="Type keyword and press Enter"
                value={formik.values.seo?.meta_keywords || []}
                onChange={(val) => formik.setFieldValue("seo.meta_keywords", val)}
              />
            </div>
          </Card>

          {/* Shipping Card */}
          <Card
            style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "24px" }}
            bodyStyle={{ padding: "24px" }}
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <MdInventory style={{ fontSize: "20px", color: "#13c2c2" }} />
              <h4 className="mb-0" style={{ fontWeight: 600 }}>Shipping</h4>
            </div>
            <div className="row g-3">
              <div className="col-md-5">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>Weight</label>
                <Input size="large" placeholder="e.g. 200g"
                  value={formik.values.shipping?.weight || ""}
                  onChange={(e) => formik.setFieldValue("shipping.weight", e.target.value)}
                  style={{ borderRadius: "8px" }}
                />
              </div>
              <div className="col-md-5">
                <label className="fw-medium mb-2 d-block" style={{ color: "#1a1a1a" }}>Dimensions</label>
                <Input size="large" placeholder="e.g. 25cm x 20cm x 2cm"
                  value={formik.values.shipping?.dimensions || ""}
                  onChange={(e) => formik.setFieldValue("shipping.dimensions", e.target.value)}
                  style={{ borderRadius: "8px" }}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox"
                    checked={formik.values.shipping?.is_fragile || false}
                    onChange={(e) => formik.setFieldValue("shipping.is_fragile", e.target.checked)}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <label className="form-check-label ms-2 fw-medium">Fragile</label>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Media Upload */}
        <div className="col-lg-4">
          {/* Image Upload Card */}
          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              marginBottom: "24px",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <FaImage style={{ fontSize: "18px", color: "#1890ff" }} />
              <h5 className="mb-0" style={{ fontWeight: 600 }}>Product Images</h5>
            </div>

            <Dropzone
              accept={{ "image/*": [] }}
              onDrop={(files) => dispatch(uploadImg(files))}
            >
              {({ getRootProps, getInputProps }) => (
                <div
                  {...getRootProps()}
                  style={{
                    border: "2px dashed #d9d9d9",
                    borderRadius: "12px",
                    padding: "32px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: "#fafafa",
                    transition: "all 0.3s",
                  }}
                  className="dropzone-hover"
                >
                  <input {...getInputProps()} />
                  <FaImage style={{ fontSize: "32px", color: "#8c8c8c", marginBottom: "12px" }} />
                  <p style={{ color: "#8c8c8c", margin: 0 }}>
                    Drag & drop images here, or click to select
                  </p>
                  <p style={{ color: "#bfbfbf", fontSize: "12px", marginTop: "8px" }}>
                    Support: JPG, PNG, GIF
                  </p>
                </div>
              )}
            </Dropzone>

            {/* Image Preview */}
            {formik.values.images && formik.values.images.length > 0 && (
              <div className="mt-4">
                <div className="d-flex flex-wrap gap-2">
                  {formik.values.images.map((i, j) => (
                    <div 
                      key={j} 
                      className="position-relative"
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #f0f0f0"
                      }}
                    >
                      <button
                        type="button"
                        onClick={async () => {
                          await dispatch(delImg(i.public_id));
                          const updatedImages = formik.values.images.filter(
                            (img) => img.public_id !== i.public_id
                          );
                          formik.setFieldValue("images", updatedImages);
                          if (getProductId) {
                            await dispatch(
                              updateAProduct({
                                id: getProductId,
                                productData: {
                                  ...formik.values,
                                  images: updatedImages,
                                },
                              })
                            );
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(0,0,0,0.5)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                        }}
                      >
                        <FaTrash size={10} />
                      </button>
                      <img 
                        src={i.url} 
                        alt="" 
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover" 
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Video Upload Card */}
          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <div className="d-flex align-items-center gap-2 mb-4">
              <FaVideo style={{ fontSize: "18px", color: "#722ed1" }} />
              <h5 className="mb-0" style={{ fontWeight: 600 }}>Product Videos</h5>
            </div>

            <Dropzone
              accept={{ "video/mp4": [".mp4"] }}
              onDrop={(files) => dispatch(uploadVideo(files))}
            >
              {({ getRootProps, getInputProps }) => (
                <div
                  {...getRootProps()}
                  style={{
                    border: "2px dashed #d9d9d9",
                    borderRadius: "12px",
                    padding: "32px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: "#fafafa",
                    transition: "all 0.3s",
                  }}
                  className="dropzone-hover"
                >
                  <input {...getInputProps()} />
                  <FaVideo style={{ fontSize: "32px", color: "#8c8c8c", marginBottom: "12px" }} />
                  <p style={{ color: "#8c8c8c", margin: 0 }}>
                    Drag & drop videos here, or click to select
                  </p>
                  <p style={{ color: "#bfbfbf", fontSize: "12px", marginTop: "8px" }}>
                    Support: MP4 format only
                  </p>
                </div>
              )}
            </Dropzone>

            {/* Video Preview */}
            {formik.values.videos && formik.values.videos.length > 0 && (
              <div className="mt-4">
                <div className="d-flex flex-wrap gap-2">
                  {formik.values.videos.map((v, i) => (
                    <div 
                      key={i} 
                      className="position-relative"
                      style={{
                        width: "120px",
                        height: "160px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #f0f0f0"
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => dispatch(delVideo(v.public_id))}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(0,0,0,0.5)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                        }}
                      >
                        <FaTrash size={10} />
                      </button>
                      <video
                        src={v.url}
                        muted
                        controls
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover" 
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Submit Button (Mobile) */}
          <div className="d-lg-none mt-4">
            <Button
              type="primary"
              block
              size="large"
              onClick={formik.handleSubmit}
              loading={isLoading}
              style={{
                height: "50px",
                borderRadius: "8px",
                backgroundColor: "#1890ff",
                border: "none",
                fontWeight: 600,
                fontSize: "16px",
              }}
            >
              {getProductId !== undefined ? "Update" : "Add"} Product
            </Button>
          </div>
        </div>
      </div>

      {/* Barcode Preview Modal */}
      <QuickAddModal
        type={quickAddModal || "color"}
        open={!!quickAddModal}
        onClose={() => setQuickAddModal(null)}
        onCreated={(newItem) => {
          if (quickAddModal === "brand") formik.setFieldValue("brand", newItem.title);
          if (quickAddModal === "category") formik.setFieldValue("category", newItem.title);
          // color & size: list auto-refreshes, user picks from dropdown
        }}
      />

      <BarcodeModal
        open={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        barcode={selectedBarcode}
        title={selectedBarcodeTitle}
        productData={{
          price: formik.values.price,
          color: formik.values.color,
          size: selectedBarcodeTitle?.split(" - ").slice(-1)[0] || "",
        }}
      />

      <style>{`
        .dropzone-hover:hover {
          border-color: #1890ff !important;
          background-color: #e6f7ff !important;
        }
        .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
        }
        .ant-select-selector {
          border-radius: 8px !important;
        }
        .ql-toolbar {
          border-radius: 8px 8px 0 0;
        }
        .ql-container {
          border-radius: 0 0 8px 8px;
        }
      `}</style>
    </div>
  );
};

export default Addproduct;
