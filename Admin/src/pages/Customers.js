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
import { getCustomers, createCustomer } from "../features/customers/customerSlice";

// const columns = [
//   { title: "SNo", dataIndex: "key" },
//   { title: "First Name", dataIndex: "firstName" },
//   { title: "Last Name", dataIndex: "lastName" },
//   { title: "Address", dataIndex: "address" },
//   { title: "Contact", dataIndex: "contactNumber" },
// ];

const columns = [
  { title: "SNo", dataIndex: "key" },
  { title: "First Name", dataIndex: "firstname" },
  { title: "Last Name", dataIndex: "lastname" },
  { title: "Email", dataIndex: "email" },
  { title: "Mobile", dataIndex: "mobile" },
];


const Customers = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(getCustomers());
  }, [dispatch]);

  const customerstate = useSelector((state) => state.customer.customers);

  // const data1 = customerstate.map((item, index) => ({
  //   key: index + 1,
  //   firstName: item.firstName,
  //   lastName: item.lastName,
  //   address: item.address,
  //   contactNumber: item.contactNumber,
  // }));

 const data1 = customerstate.map((item, index) => ({
  key: index + 1,
  firstname: item.firstname,
  lastname: item.lastname,
  email: item.email,
  mobile: item.mobile,
}));


  const handleSubmit = (values) => {
    dispatch(createCustomer(values)).then(() => {
      dispatch(getCustomers());
      setOpen(false);
      form.resetFields();
    });
  };

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
        {/* <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="address" label="Address" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="contactNumber" label="Contact Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Create Customer
          </Button>
        </Form> */}



       <Form form={form} layout="vertical" onFinish={handleSubmit}>
  <Form.Item
    name="firstname"
    label="First Name"
    rules={[
      { required: true, message: "First name is required" },
      { min: 2, message: "Minimum 2 characters required" },
    ]}
  >
    <Input />
  </Form.Item>

  <Form.Item
    name="lastname"
    label="Last Name"
    rules={[
      { required: true, message: "Last name is required" },
      { min: 2, message: "Minimum 2 characters required" },
    ]}
  >
    <Input />
  </Form.Item>

  <Form.Item
    name="email"
    label="Email"
    rules={[
      { required: true, message: "Email is required" },
      { type: "email", message: "Enter valid email (example@domain.com)" },
    ]}
  >
    <Input />
  </Form.Item>

  <Form.Item
    name="mobile"
    label="Mobile Number"
    rules={[
      { required: true, message: "Mobile number is required" },
      {
        pattern: /^[0-9]{10}$/,
        message: "Mobile number must be exactly 10 digits",
      },
    ]}
  >
    <Input maxLength={10} />
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
