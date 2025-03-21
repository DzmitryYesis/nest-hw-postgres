export const loginLength = {
  minLength: 3,
  maxLength: 10,
};

export const loginMatch = /^[a-zA-Z0-9_-]*$/;

export const passwordLength = {
  minLength: 6,
  maxLength: 20,
};

export const emailMatch = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
