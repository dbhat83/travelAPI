class apiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    // ---- (1) FILTERING -------//
    const queryObj = { ...this.queryStr };
    const exculdedFields = ['page', 'sort', 'limit', 'fields'];
    exculdedFields.forEach((el) => delete queryObj[el]);

    //----- (1.1) ADVANCE FILTERING -------- //

    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryString));
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-date');
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      //to exclude certain fields from displaying
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    const page = this.queryStr.page * 1;
    const limit = this.queryStr.limit * 1;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = apiFeatures;
