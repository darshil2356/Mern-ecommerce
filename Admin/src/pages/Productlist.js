import React, { useEffect, useState } from "react";
import { Table } from "antd";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { deleteAProduct, getProducts } from "../features/product/productSlice";
import { Link } from "react-router-dom";
import { delImg } from "../features/upload/uploadSlice";
import CustomModal from "../components/CustomModal";
import BarcodeModal from "../components/BarcodeModal";
import JsBarcode from "jsbarcode";



const columns = [
  {
    title: "SNo",
    dataIndex: "key",
  },
  {
    title: "Title",
    dataIndex: "title",
  },
  {
    title: "Brand",
    dataIndex: "brand",
  },
  {
    title: "Barcode",
    dataIndex: "barcode",
  },
  {
    title: "Category",
    dataIndex: "category",
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
  },
  {
    title: "Price",
    dataIndex: "price",
  },
  {
    title: "Action",
    dataIndex: "action",
  },
];


const Productlist = () => {
  const [open, setOpen] = useState(false);
  const [productId, setproductId] = useState("");
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
const [selectedBarcode, setSelectedBarcode] = useState("");
const [selectedTitle, setSelectedTitle] = useState("");



  const showModal = (e) => {
    setOpen(true);
    setproductId(e);
  };


  const downloadBarcode = (barcode) => {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, barcode, {
    format: "CODE128",
    width: 2,
    height: 80,
    displayValue: true,
  });

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${barcode}.png`;
  link.click();
};


  const hideModal = () => {
    setOpen(false);
  };
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getProducts());
  }, []);
  const productState = useSelector((state) => state?.product?.products);
  const data1 = [];
  for (let i = 0; i < productState.length; i++) {
    data1.push({
      key: i + 1,
      title: productState[i].title,
      brand: productState[i].brand,
      // barcode: productState[i].barcode || "-",
      barcode: productState[i].barcode ? (
  <>
    {/* <span className="me-2">{productState[i].barcode}</span>  */}
    <button
      className="btn btn-sm btn-outline-primary me-1"
      onClick={() => {
        setSelectedBarcode(productState[i].barcode);
        setSelectedTitle(productState[i].title);
        setBarcodeModalOpen(true);
      }}
    >
      View
    </button>
    <button
      className="btn btn-sm btn-outline-success"
      onClick={() => downloadBarcode(productState[i].barcode)}
    >
      Download
    </button>
  </>
) : (
  "-"
),

      category: productState[i].category,
      color: productState[i].color,
      quantity: productState[i].quantity,
      price: `${productState[i].price}`,
      action: (
        <>
          <Link
            to={`/admin/product/${productState[i]._id}`}
            className=" fs-3 text-success"
          >
            <BiEdit />
          </Link>
          <button
            className="ms-3 fs-3 text-danger bg-transparent border-0"
            onClick={() => showModal(productState[i]._id)}
          >
            <AiFillDelete />
          </button>
        </>
      ),
    });
  }
  const deleteProduct = (e) => {
    dispatch(deleteAProduct(e));
    dispatch(delImg(e));

    setOpen(false);
    setTimeout(() => {
      dispatch(getProducts());
    }, 100);
  };
  console.log(data1);
  return (
    <div>
      <h3 className="mb-4 title">Products</h3>
      <div>
        <Table columns={columns} dataSource={data1} />
      </div>
      <CustomModal
        hideModal={hideModal}
        open={open}
        performAction={() => {
          deleteProduct(productId);
        }}
        title="Are you sure you want to delete this Product?"
      />
      <BarcodeModal
  open={barcodeModalOpen}
  onClose={() => setBarcodeModalOpen(false)}
  barcode={selectedBarcode}
  title={selectedTitle}
/>

    </div>
  );
};

export default Productlist;
