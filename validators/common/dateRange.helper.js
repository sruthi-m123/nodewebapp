export const validateDateRange = (startKey, endKey, message) => {
  return (value, helpers) => {
    if (value[startKey] && value[endKey]) {
      if (new Date(value[endKey]) <= new Date(value[startKey])) {
        return helpers.error('date.invalidRange', { message });
      }
    }
    return value;
  };
};
