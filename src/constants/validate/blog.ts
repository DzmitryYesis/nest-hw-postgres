export const blogNameLength = {
  minLength: 3,
  maxLength: 15,
};

export const blogDescriptionLength = {
  minLength: 3,
  maxLength: 500,
};

export const blogWebsiteUrlLength = {
  minLength: 3,
  maxLength: 100,
};

export const websiteUrlMatch =
  /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/;
