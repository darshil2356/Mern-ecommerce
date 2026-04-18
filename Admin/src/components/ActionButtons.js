import React from "react";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { AiOutlineEye } from "react-icons/ai";
import { Link } from "react-router-dom";

const btn = "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 border-0 cursor-pointer";

export const EditButton = ({ to, onClick }) =>
  to ? (
    <Link to={to} className={`${btn} bg-indigo-50 hover:bg-indigo-100 text-indigo-600`}>
      <BiEdit className="text-lg" />
    </Link>
  ) : (
    <button onClick={onClick} className={`${btn} bg-indigo-50 hover:bg-indigo-100 text-indigo-600`}>
      <BiEdit className="text-lg" />
    </button>
  );

export const DeleteButton = ({ onClick }) => (
  <button onClick={onClick} className={`${btn} bg-red-50 hover:bg-red-100 text-red-500`}>
    <AiFillDelete className="text-lg" />
  </button>
);

export const ViewButton = ({ to }) => (
  <Link to={to} className={`${btn} bg-emerald-50 hover:bg-emerald-100 text-emerald-600`}>
    <AiOutlineEye className="text-lg" />
  </Link>
);

const ActionButtons = ({ editTo, onEdit, onDelete, viewTo }) => (
  <div className="flex gap-2">
    {viewTo && <ViewButton to={viewTo} />}
    {(editTo || onEdit) && <EditButton to={editTo} onClick={onEdit} />}
    {onDelete && <DeleteButton onClick={onDelete} />}
  </div>
);

export default ActionButtons;
