import React, { useEffect, useState ,useMemo} from "react";
import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import { Column } from "@ant-design/plots";
import { Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  getMonthlyData,
  getOrders,
  getYearlyData,
} from "../features/auth/authSlice";

import {  DatePicker } from "antd";
import dayjs from "dayjs";



const columns = [
  {
    title: "SNo",
    dataIndex: "key",
  },
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Product Count",
    dataIndex: "product",
  },
  {
    title: "Total Price",
    dataIndex: "price",
  },
  {
    title: "Total Price After Discount",
    dataIndex: "dprice",
  },
  {
    title: "Status",
    dataIndex: "staus",
  },
];

const Dashboard = () => {
  const dispatch = useDispatch();

  const monthlyDataState = useSelector((state) => state?.auth?.monthlyData);
  const yearlyDataState = useSelector((state) => state?.auth?.yearlyData);
  const [selectedMode, setSelectedMode] = useState("ONLINE");
   const [dateRange, setDateRange] = useState(null); 

  const orderState = useSelector((state) => state?.auth?.orders?.orders);
//   const filteredOrders = useMemo(() => {
//   if (!orderState) return [];
//   return orderState.filter(
//     (order) => (order.mode || "ONLINE") === selectedMode
//   );
// }, [orderState, selectedMode]);
const filteredOrders = useMemo(() => {
  if (!orderState) return [];

  return orderState.filter((order) => {
    // mode filter
    if ((order.mode || "ONLINE") !== selectedMode) return false;

    // date filter
    if (dateRange) {
      const orderDate = dayjs(order.createdAt);
      const [start, end] = dateRange;

      if (
        orderDate.isBefore(start.startOf("day")) ||
        orderDate.isAfter(end.endOf("day"))
      ) {
        return false;
      }
    }

    return true;
  });
}, [orderState, selectedMode, dateRange]);


const totalIncome = useMemo(() => {
  return filteredOrders.reduce(
    (sum, order) => sum + (order.totalPrice || 0),
    0
  );
}, [filteredOrders]);

const totalSales = useMemo(() => {
  return filteredOrders.length;
}, [filteredOrders]);



  console.log(orderState);

  const [dataMonthly, setDataMonthly] = useState([]);
  const [dataMonthlySales, setDataMonthlySales] = useState([]);
  const [orderData, setOrderData] = useState([]);
 
// [dayjsStart, dayjsEnd]


  const getTokenFromLocalStorage = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const config3 = {
    headers: {
      Authorization: `Bearer ${
        getTokenFromLocalStorage !== null ? getTokenFromLocalStorage.token : ""
      }`,
      Accept: "application/json",
    },
  };

  useEffect(() => {
    dispatch(getMonthlyData(config3));
    dispatch(getYearlyData(config3));
    dispatch(getOrders(config3));
  }, []);

useEffect(() => {
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const incomeByMonth = {};
  const salesByMonth = {};

  filteredOrders.forEach((order) => {
    const date = new Date(order.createdAt);
    const month = monthNames[date.getMonth()];

    incomeByMonth[month] =
      (incomeByMonth[month] || 0) + order.totalPrice;

    salesByMonth[month] =
      (salesByMonth[month] || 0) + 1;
  });

  setDataMonthly(
    Object.keys(incomeByMonth).map((m) => ({
      type: m,
      income: incomeByMonth[m],
    }))
  );

  setDataMonthlySales(
    Object.keys(salesByMonth).map((m) => ({
      type: m,
      income: salesByMonth[m],
    }))
  );

  setOrderData(
    filteredOrders.map((order, i) => ({
      key: i,
      // name: `${order.user.firstname} ${order.user.lastname}`,
      name: order.user
  ? `${order.user.firstname || ""} ${order.user.lastname || ""}`
  : "Deleted User",

      product: order.orderItems?.length,
      price: order.totalPrice,
      dprice: order.totalPriceAfterDiscount,
      staus: order.orderStatus,
    }))
  );
}, [filteredOrders]);


  const config = {
    data: dataMonthly,
    xField: "type",
    yField: "income",
    color: ({ type }) => {
      return "#ffd333";
    },
    label: {
      position: "middle",
      style: {
        fill: "#FFFFFF",
        opacity: 1,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      type: {
        alias: "Month",
      },
      sales: {
        alias: "Income",
      },
    },
  };

  const config2 = {
    data: dataMonthlySales,
    xField: "type",
    yField: "income",
    color: ({ type }) => {
      return "#ffd333";
    },
    label: {
      position: "middle",
      style: {
        fill: "#FFFFFF",
        opacity: 1,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      type: {
        alias: "Month",
      },
      sales: {
        alias: "Income",
      },
    },
  };

  return (
    <div>
      <h3 className="mb-4 title">Dashboard</h3>
      {/* <div className="flex gap-2 mb-4">
  <button
    className={`px-4 py-1 rounded text-sm ${
      selectedMode === "ONLINE"
        ? "bg-black text-white"
        : "bg-gray-200"
    }`}
    onClick={() => setSelectedMode("ONLINE")}
  >
    Online
  </button>

  <button
    className={`px-4 py-1 rounded text-sm ${
      selectedMode === "OFFLINE"
        ? "bg-black text-white"
        : "bg-gray-200"
    }`}
    onClick={() => setSelectedMode("OFFLINE")}
  >
    Offline
  </button>
</div> */}

{/* <div className="flex items-center gap-3 mb-6"> */}
<div className="flex items-center justify-between mb-6">

  {/* MODE TOGGLE (already present) */}
  <div className="flex gap-2">
    <button
      className={`px-4 py-1 rounded text-sm ${
        selectedMode === "ONLINE"
          ? "bg-black text-white"
          : "bg-gray-200"
      }`}
      onClick={() => setSelectedMode("ONLINE")}
    >
      Online
    </button>

    <button
      className={`px-4 py-1 rounded text-sm ${
        selectedMode === "OFFLINE"
          ? "bg-black text-white"
          : "bg-gray-200"
      }`}
      onClick={() => setSelectedMode("OFFLINE")}
    >
      Offline
    </button>
  </div>

  {/* DATE RANGE FILTER */}
  <DatePicker.RangePicker
    size="small"
    className="w-[220px] "
    popupClassName="single-calendar-range"
    placeholder={["Start date", "End date"]}
    value={dateRange}
    onChange={(dates) => setDateRange(dates)}
    allowClear
  />
</div>


      <div className="d-flex justify-content-between align-items-center gap-3">
        <div className="d-flex p-3 justify-content-between align-items-end flex-grow-1 bg-white p-3 roudned-3">
          <div>
            <p className="desc">Total Income</p>
            {/* <h4 className="mb-0 sub-title">
              Rs.{yearlyDataState && yearlyDataState[0]?.amount}
            </h4> */}
            <h4 className="mb-0 sub-title">
  Rs.{totalIncome}
</h4>

          </div>
          <div className="d-flex flex-column align-items-end">
            <p className="mb-0  desc">Income in Last Year from Today</p>
          </div>
        </div>
        <div className="d-flex p-3 justify-content-between align-items-end flex-grow-1 bg-white p-3 roudned-3">
          <div>
            <p className="desc">Total Sales</p>
            <h4 className="mb-0 sub-title">
  {totalSales}
</h4>

          </div>
          <div className="d-flex flex-column align-items-end">
            <p className="mb-0  desc">Sales in Last Year from Today</p>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items gap-3">
        <div className="mt-4 flex-grow-1 w-50">
          <h3 className="mb-5 title">Income in Last Year from Today</h3>
          <div>
            <Column {...config} />
          </div>
        </div>
        <div className="mt-4 flex-grow-1 ">
          <h3 className="mb-5 title">Sales in Last Year from Today </h3>
          <div>
            <Column {...config2} />
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="mb-5 title">Recent Orders</h3>
        <div>
          <Table columns={columns} dataSource={orderData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
