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
import { Select, Modal } from "antd";
import Dropzone from "react-dropzone";
import { clearUploads } from "../features/upload/uploadSlice";
import JsBarcode from "jsbarcode";
import { FaEye, FaDownload } from "react-icons/fa";
import { MdPrint } from "react-icons/md";
import BarcodeModal from "../components/BarcodeModal";

// import { delImg, uploadImg } from "../features/upload/uploadSlice";
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
  color: yup.string().required("Color is Required"),

  //   size: yup
  // .array()
  // .min(1, "Pick at least one size")
  // .required("Size is Required"),

  // quantity: yup.number().required("Quantity is Required"),
  // videos: yup.array().optional(),
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
  const barcodeSvgRef = useRef(null);

  console.log(color);
  useEffect(() => {
    dispatch(getBrands());
    dispatch(getCategories());
    dispatch(getColors());
  }, []);

  const brandState = useSelector((state) => state.brand.brands);
  const catState = useSelector((state) => state.pCategory.pCategories);
  const colorState = useSelector((state) => state.color.colors);
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
     productSize,   // 👈 ADD THIS
    productQuantity,
    productImages,
     productVideos,
  } = newProduct;

  const videoState = useSelector((state) => state?.upload?.videos);

  useEffect(() => {
    if (getProductId !== undefined) {
      dispatch(resetState()); // ✅ ADD THIS LINE
      dispatch(getAProduct(getProductId));
    } else {
      dispatch(resetState());
    }
  }, [getProductId]);

  const coloropt = [];
  colorState.forEach((i) => {
    coloropt.push({
      label: (
        <div className="col-3">
          <ul
            className="colors ps-0"
            style={{
              width: "20px",
              height: "20px",
              marginBottom: "10px",
              backgroundColor: i.title,
              borderRadius: "50%", // Added inline style for rounded shape
              listStyle: "none", // Hide bullet points
              border: "2px solid transparent",
            }}
          ></ul>
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
      color: productColors?._id || productColors || undefined,
      // size: productSize || [],

      // quantity: productQuantity || "",



sizeStock: newProduct?.sizeStock || [],


      inventory: {
        offline: true,
        online: newProduct?.inventory?.online ?? false,
      },

      images: productImages || "",
      // videos: [], // ✅ REQUIRED
      videos: productVideos || [],
    },
    validationSchema: schema,
    // onSubmit: (values) => {
    //   console.log(values);
    //   if (getProductId !== undefined) {
    //     const data = { id: getProductId, productData: values };
    //     dispatch(updateAProduct(data));
    //   } else {
    //     dispatch(createProducts(values));
    //     formik.resetForm();
    //     setColor(null);
    //     setTimeout(() => {
    //       dispatch(resetState());
    //     }, 3000);
    //   }
    // },

    onSubmit: async (values) => {
       const totalQuantity = values.sizeStock.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
      const payload = {
        ...values,
        quantity: totalQuantity,   // 🔥 REQUIRED FOR MONGOOSE
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

          // ✅ HARD RESET (THIS FIXES YOUR ISSUE)
          formik.resetForm();
          dispatch(resetState());
          dispatch(delImg());
          dispatch(delVideo());
          dispatch(clearUploads()); // ← ADD THIS ONLY

          navigate("/admin/list-product"); // ✅ ADD THIS LINE
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

  // useEffect(() => {
  //   if (getProductId && imgState.length === 0 && productImages) {
  //     // 1. If Editing and no NEW images uploaded yet, show existing ones
  //     formik.setFieldValue("images", productImages);
  //   } else {
  //     // 2. If new images are uploaded (imgState has data), use those
  //     formik.setFieldValue("images", imgState);
  //   }

  //   // Same logic for videos
  //   if (getProductId && videoState.length === 0 && newProduct?.videos) {
  //     formik.setFieldValue("videos", newProduct.videos);
  //   } else {
  //     formik.setFieldValue("videos", videoState);
  //   }
  // }, [imgState, videoState, productImages]); // Add productImages to dependency





  useEffect(() => {
  // IMAGES
  if (getProductId) {
    if (imgState.length > 0) {
      formik.setFieldValue("images", imgState);
    } else if (productImages) {
      formik.setFieldValue("images", productImages);
    }
  } else {
    formik.setFieldValue("images", imgState);
  }

  // VIDEOS
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




  // useEffect(() => {
  //   formik.setFieldValue("images", imgState);
  //   formik.setFieldValue("videos", videoState);
  // }, [imgState, videoState]);

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

  return (
    <div>
      <h3 className="mb-4 title">
        {getProductId !== undefined ? "Edit" : "Add"} Product
      </h3>
      <div>
        <form
          onSubmit={formik.handleSubmit}
          className="d-flex gap-3 flex-column"
        >
          <CustomInput
            type="text"
            label="Enter Product Title"
            name="title"
            onChng={formik.handleChange("title")}
            onBlr={formik.handleBlur("title")}
            val={formik.values.title}
          />
          <div className="error">
            {formik.touched.title && formik.errors.title}
          </div>
          <div className="">
            <ReactQuill
              theme="snow"
              name="description"
              onChange={formik.handleChange("description")}
              value={formik.values.description}
            />
          </div>
          <div className="error">
            {formik.touched.description && formik.errors.description}
          </div>
          <CustomInput
            type="number"
            label="Enter Product Price"
            name="price"
            onChng={formik.handleChange("price")}
            onBlr={formik.handleBlur("price")}
            val={formik.values.price}
          />
          <div className="error">
            {formik.touched.price && formik.errors.price}
          </div>
          <select
            name="brand"
            onChange={formik.handleChange("brand")}
            onBlur={formik.handleBlur("brand")}
            value={formik.values.brand}
            className="form-control py-3 mb-3"
            id=""
          >
            <option value="">Select Brand</option>
            {brandState.map((i, j) => {
              return (
                <option key={j} value={i.title}>
                  {i.title}
                </option>
              );
            })}
          </select>
          <div className="error">
            {formik.touched.brand && formik.errors.brand}
          </div>
          <select
            name="category"
            onChange={formik.handleChange("category")}
            onBlur={formik.handleBlur("category")}
            value={formik.values.category}
            className="form-control py-3 mb-3"
            id=""
          >
            <option value="">Select Category</option>
            {catState.map((i, j) => {
              return (
                <option key={j} value={i.title}>
                  {i.title}
                </option>
              );
            })}
          </select>
          <div className="error">
            {formik.touched.category && formik.errors.category}
          </div>
          <select
            name="tags"
            onChange={formik.handleChange("tags")}
            onBlur={formik.handleBlur("tags")}
            value={formik.values.tags}
            className="form-control py-3 mb-3"
            id=""
          >
            <option value="" disabled>
              Select Category
            </option>
            <option value="featured">Featured</option>
            <option value="popular">Popular</option>
            <option value="special">Special</option>
          </select>
          <div className="error">
            {formik.touched.tags && formik.errors.tags}
          </div>

          <Select
  allowClear
  className="w-100"
  placeholder="Select color"
  value={formik.values.color}
  onChange={(value) => formik.setFieldValue("color", value)}
  options={coloropt}
/>




          <div className="error">
            {formik.touched.color && formik.errors.color}
          </div>
         

          {/* SIZE SELECTOR */}


<Select
  mode="multiple"
  allowClear
  className="w-100 mt-3"
  placeholder="Select sizes"
  value={formik.values.sizeStock.map(s => s.size)}
  onChange={(selectedSizes) => {

    const existing = formik.values.sizeStock;

    const updated = selectedSizes.map(size => {
      const found = existing.find(s => s.size === size);
      return found ? found : { size, quantity: "" };
    });

    formik.setFieldValue("sizeStock", updated);
  }}
  options={[
    { label: "XS", value: "XS" },
    { label: "S", value: "S" },
    { label: "M", value: "M" },
    { label: "L", value: "L" },
    { label: "XL", value: "XL" },
    { label: "2XL", value: "2XL" },
    { label: "3XL", value: "3XL" },
  ]}
/>


{formik.values.sizeStock.length > 0 && (
  <div className="mt-4">
    <table className="table table-bordered">
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Size</th>
          <th>Quantity</th>
          <th>Barcode</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {formik.values.sizeStock.map((item, index) => {
          // Generate preview barcode
          const previewBarcode = formik.values.title 
            ? `PRD-${formik.values.title.substring(0, 3).toUpperCase()}-${item.size}`
            : '';
            
          return (
            <tr key={item.size}>
              <td>{index + 1}</td>
              <td>{item.size}</td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  value={item.quantity}
                  min={0}
                  onChange={(e) => {
                    const updated = [...formik.values.sizeStock];
                    updated[index].quantity = Number(e.target.value);
                    formik.setFieldValue("sizeStock", updated);
                  }}
                />
              </td>
              <td style={{ fontSize: "12px" }}>{previewBarcode || "-"}</td>
              <td>
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                    onClick={() => {
                      if (previewBarcode) {
                        setSelectedBarcode(previewBarcode);
                        setSelectedBarcodeTitle(`${formik.values.title} - Size ${item.size}`);
                        setBarcodeModalOpen(true);
                      }
                    }}
                    title="View Barcode"
                  >
                    <FaEye size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                    onClick={() => {
                      if (previewBarcode) {
                        const canvas = document.createElement("canvas");
                        JsBarcode(canvas, previewBarcode, {
                          format: "CODE128",
                          width: 2,
                          height: 80,
                          displayValue: true,
                        });
                        const link = document.createElement("a");
                        link.href = canvas.toDataURL("image/png");
                        link.download = `${previewBarcode}.png`;
                        link.click();
                      }
                    }}
                    title="Download Barcode"
                  >
                    <FaDownload size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                    onClick={() => {
                      if (previewBarcode) {
                        const printWindow = window.open("", "", "width=600,height=400");
                        printWindow.document.write(`
                          <html>
                            <head><title>${formik.values.title} - ${item.size}</title></head>
                            <body style="text-align:center;">
                              <h4>${formik.values.title} - ${item.size}</h4>
                              <svg id="barcode"></svg>
                              <script src="https://cdn.jsdelivr.net/npm/jsbarcode/dist/JsBarcode.all.min.js"><\/script>
                              <script>
                                JsBarcode("#barcode", "${previewBarcode}", { format: "CODE128", width: 2, height: 80, displayValue: true });
                                window.print();
                              <\/script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                    title="Print Barcode"
                  >
                    <MdPrint size={16} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}


<div className="error">
  {formik.touched.size && formik.errors.size}
</div>

          <div className="error">
            {formik.touched.quantity && formik.errors.quantity}
          </div>
          <div className="mb-3">
            <label className="fw-bold mb-2 d-block">
              Inventory Availability
            </label>

            {/* OFFLINE – always enabled */}
            <div className="form-check mb-1">
              <input
                className="form-check-input"
                type="checkbox"
                checked={true}
                disabled
              />
              <label className="form-check-label">Offline</label>
            </div>

            {/* ONLINE – optional */}
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name="inventory.online"
                checked={formik.values.inventory.online}
                onChange={(e) =>
                  formik.setFieldValue("inventory.online", e.target.checked)
                }
              />
              <label className="form-check-label">Online Store</label>
            </div>
          </div>

          <div className="bg-white border-1 p-5 text-center">
            {/* <Dropzone
              onDrop={(acceptedFiles) => dispatch(uploadImg(acceptedFiles))}
            > */}
            <Dropzone
              accept={{ "image/*": [] }}
              onDrop={(files) => dispatch(uploadImg(files))}
            >
              {({ getRootProps, getInputProps }) => (
                <section>
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <p>
                      Drag 'n' drop some files here, or click to select files
                    </p>
                  </div>
                </section>
              )}
            </Dropzone>
          </div>
          <div className="showimages d-flex flex-wrap gap-3">
            {/* {imgState?.map((i, j) => { */}
            {formik.values.images &&
              formik.values.images.map((i, j) => {
                return (
                  <div className=" position-relative" key={j}>
                    <button
                      type="button"
                      onClick={() => dispatch(delImg(i.public_id))}
                      className="btn-close position-absolute"
                      style={{ top: "10px", right: "10px" }}
                    ></button>
                    <img src={i.url} alt="" width={200} height={200} />
                  </div>
                );
              })}
          </div>
          {/* VIDEO UPLOAD SECTION */}
          <div className="bg-white border-1 p-5 text-center mt-4">
            <h5 className="mb-3">Upload Product Videos (Reels)</h5>

            <Dropzone
              accept={{ "video/mp4": [".mp4"] }}
              onDrop={(files) => dispatch(uploadVideo(files))}
            >
              {({ getRootProps, getInputProps }) => (
                <section>
                  <div {...getRootProps()} style={{ cursor: "pointer" }}>
                    <input {...getInputProps()} />
                    <p>
                      Drag & drop videos here, or click to select (MP4 only)
                    </p>
                  </div>
                </section>
              )}
            </Dropzone>
          </div>

          {/* VIDEO PREVIEW */}
          <div className="d-flex flex-wrap gap-3 mt-4">
            {/* {videoState?.map((v, i) => ( */}
            {formik.values.videos?.map((v, i) => (

              <div className="position-relative" key={i}>
                <button
                  type="button"
                  onClick={() => dispatch(delVideo(v.public_id))}
                  className="btn-close position-absolute"
                  style={{ top: "10px", right: "10px", zIndex: 2 }}
                ></button>

                <video
                  src={v.url}
                  width={200}
                  height={300}
                  muted
                  controls
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
          <button
            className="btn btn-success border-0 rounded-3 my-5"
            type="submit"
          >
            {getProductId !== undefined ? "Edit" : "Add"} Product
          </button>
        </form>
      </div>
      
      {/* Barcode Preview Modal */}
      <BarcodeModal
        open={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        barcode={selectedBarcode}
        title={selectedBarcodeTitle}
      />
    </div>
  );
};

export default Addproduct;
