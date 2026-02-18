// import React, { useEffect } from "react";
// import { Table } from "antd";
// import { useDispatch, useSelector } from "react-redux";
// import { getUsers } from "../features/cutomers/customerSlice";
// const columns = [
//   {
//     title: "SNo",
//     dataIndex: "key",
//   },
//   {
//     title: "Name",
//     dataIndex: "name",
//     sorter: (a, b) => a.name.length - b.name.length,
//   },
//   {
//     title: "Email",
//     dataIndex: "email",
//   },
//   {
//     title: "Mobile",
//     dataIndex: "mobile",
//   },
// ];

// const Customers = () => {
//   const dispatch = useDispatch();
//   useEffect(() => {
//     dispatch(getUsers());
//   }, []);
//   const customerstate = useSelector((state) => state.customer.customers);
//   const data1 = [];
//   for (let i = 0; i < customerstate.length; i++) {
//     if (customerstate[i].role !== "admin") {
//       data1.push({
//         key: i + 1,
//         name: customerstate[i].firstname + " " + customerstate[i].lastname,
//         email: customerstate[i].email,
//         mobile: customerstate[i].mobile,
//       });
//     }
//   }

//   return (
//     <div>
//       <h3 className="mb-4 title">Customers</h3>
//       <div>
//         <Table columns={columns} dataSource={data1} />
//       </div>
//     </div>
//   );
// };

// export default Customers;



import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getUsers, createCustomer } from "../features/customers/customerSlice";

const columns = [
  {
    title: "SNo",
    dataIndex: "key",
  },
  {
    title: "Name",
    dataIndex: "name",
    sorter: (a, b) => a.name.length - b.name.length,
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Mobile",
    dataIndex: "mobile",
  },
];

const Customers = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const customerstate = useSelector((state) => state.customer.customers);

  const data1 = [];
  for (let i = 0; i < customerstate.length; i++) {
    if (customerstate[i].role !== "admin") {
      data1.push({
        key: i + 1,
        name:
          customerstate[i].firstname +
          " " +
          customerstate[i].lastname,
        email: customerstate[i].email,
        mobile: customerstate[i].mobile,
      });
    }
  }

  const handleSubmit = (values) => {
    dispatch(createCustomer(values)).then(() => {
      dispatch(getUsers());
      setOpen(false);
      form.resetFields();
    });
  };
  const fullState = useSelector((state) => state);
console.log("FULL REDUX STATE:", fullState);


  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3 className="mb-4 title">Customers</h3>

        <Button type="primary" onClick={() => setOpen(true)}>
          + Add Customer
        </Button>
      </div>

      <Table columns={columns} dataSource={data1} />

      <Modal
        title="Add Customer"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="firstname" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="lastname" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="mobile" label="Mobile" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          

          <Button type="primary" htmlType="submit" block>
            Create Customer
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;