const validate = (schema, source = "body") => (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
        const issues = result.error.issues || result.error.errors || [];
        const errors = issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
        }));

        return res.status(400).json({
            message: "Validation Error",
            errors,
        });
    }

    req[source] = result.data;
    next();
};

module.exports = validate;
