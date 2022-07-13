const customerRouter = require('./customer.route.js');
const productRouter = require('./product.route');
const proCategoryRouter = require('./pro-category.route');
const employeeRouter = require('./employee.route');
const orderRouter = require('./order.route');

function route(app) {
  app.use('/api/customers', customerRouter);
  app.use('/api/employees', employeeRouter);
  app.use('/api/products', productRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/product-category', proCategoryRouter);

  // Catch error
  app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
  });
  app.use((err, req, res) => {
    res.status(err.status || 500).json({ message: err.message });
  });
}

module.exports = route;
