import { STATUS_CODES } from "../utils/statusCodes.js";
import logger from "../utils/logger.js";

export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    try {
      let validated = {};

      if (schema.body || schema.query || schema.params) {
        if (schema.body) {
          const { error, value } = schema.body.validate(req.body, { abortEarly: false });
          if (error) throw error;
          validated = { ...validated, ...value };
        }

        if (schema.query) {
          const { error, value } = schema.query.validate(req.query, { abortEarly: false });
          if (error) throw error;
          validated = { ...validated, ...value };
        }

        if (schema.params) {
          const { error, value } = schema.params.validate(req.params, { abortEarly: false });
          if (error) throw error;
          validated = { ...validated, ...value };
        }

        req.validatedData = validated;
        return next();
      }

      const { error, value } = schema.validate(req[property], {
        abortEarly: false
      });

      if (error) {
        const messages = error.details.map(d => d.message);
        logger.warn("validation error at " + req.originalUrl);
        logger.warn("Method: " + req.method);
        logger.warn("Errors: " + JSON.stringify(messages, null, 2));
        logger.warn("Payload: " + JSON.stringify(req[property], null, 2));

        return res.status(STATUS_CODES.BAD_REQUEST).json({
          message: messages[0]
        });
      }

      req.validatedData = value;
      next();
    } catch (error) {
      const messages = error.details?.map(d => d.message) || ["Invalid request data"];
      logger.warn("validation error at " + req.originalUrl);
      logger.warn("Method: " + req.method);
      logger.warn("Errors: " + JSON.stringify(messages, null, 2));

      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: messages[0]
      });
    }
  };
};
