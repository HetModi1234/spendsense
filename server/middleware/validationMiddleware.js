const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    // Replace with parsed/sanitized data if schema defines body/query/params
    if (validated.body) req.body = validated.body;
    if (validated.query) req.query = validated.query;
    if (validated.params) req.params = validated.params;
    next();
  } catch (error) {
    if (error.errors) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${messages}`,
        errors: error.errors
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Invalid request data'
    });
  }
};

module.exports = { validate };
