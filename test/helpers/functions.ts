export const getStringWithLength = (length: number) => {
  return 'a'.repeat(length);
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
