function validateAddress({ name, building, city, state, pincode, phone, altPhone, addressType }) {
  if (!name?.trim() || !building || !city || !state || !pincode || !phone || !addressType) {
    return "All required fields must be filled properly.";
  }

  
  if (!/^\d{6}$/.test(pincode)) {
    return "Pincode must be exactly 6 digits.";
  }

  
  if (!/^\d{10}$/.test(phone)) {
    return "Phone number must be exactly 10 digits.";
  }
  if (/^(\d)\1{9}$/.test(phone)) {
    return "Phone number cannot have all digits the same.";
  }

  
  if (altPhone) {
    if (!/^\d{10}$/.test(altPhone)) {
      return "Alternate phone must be exactly 10 digits.";
    }
    if (/^(\d)\1{9}$/.test(altPhone)) {
      return "Alternate phone cannot have all digits the same.";
    }
    if (altPhone === phone) {
      return "Alternate phone cannot be the same as primary phone.";
    }
  }

  return null; 
}
