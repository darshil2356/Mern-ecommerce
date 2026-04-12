const buildQueryObject = (query = {}) => {
  const queryObj = { ...query };
  const excludedFields = ["page", "sort", "limit", "fields", "store"];
  excludedFields.forEach((field) => delete queryObj[field]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  return JSON.parse(queryStr);
};

const applySorting = (query, sortValue) => {
  if (sortValue) {
    return query.sort(sortValue.split(",").join(" "));
  }
  return query.sort("-createdAt");
};

const applyPagination = (query, page = 1, limit = 20) => {
  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 20;
  const skip = (pageNumber - 1) * pageSize;
  return query.skip(skip).limit(pageSize);
};

module.exports = { buildQueryObject, applySorting, applyPagination };