export const mockMailService = {
  sendEmailWithConfirmationCode: jest.fn().mockResolvedValue(undefined),
  sendEmailWithRecoveryPasswordCode: jest.fn().mockResolvedValue(undefined),
};
