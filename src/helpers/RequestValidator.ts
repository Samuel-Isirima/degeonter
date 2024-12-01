import Validator from "validatorjs";

const RequestValidator = async (body, rules, customMessages) => {
    return new Promise((resolve, reject) => {
      const validation = new Validator(body, rules, customMessages);
      validation.passes(() => resolve({status: true}));
      validation.fails(() => resolve({status: false, errors: validation.errors, formattedErrors: extractValidationErrorMessages(validation.errors)})); // Resolve with false in case of validation failure
    });
}


function extractValidationErrorMessages(errors: any): String[] {
  const errorMessages: String[] = [];
  errors = errors.errors
  for (const field in errors) {
      if (Array.isArray(errors[field])) {
      errorMessages.push(...errors[field]);
      }
  }
  
  return errorMessages;
  }

export default RequestValidator;  