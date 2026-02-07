import { z } from "zod";

// Booking status enum
export const BookingStatus = z.enum([
  "PENDING",      // Chờ duyệt
  "APPROVED",     // Đã duyệt
  "DEPOSITED",    // Đã đặt cọc
  "CONTRACTED",   // Đã ký HĐ
  "COMPLETED",    // Hoàn thành
  "CANCELLED",    // Đã hủy
]);

// Transaction type enum
export const TransactionType = z.enum([
  "DEPOSIT",      // Đặt cọc
  "PAYMENT",      // Thanh toán
  "COMMISSION",   // Hoa hồng
  "REFUND",       // Hoàn tiền
]);

// Create booking schema
export const bookingCreateSchema = z.object({
  propertyId: z.string().min(1, "Vui lòng chọn sản phẩm"),
  customerId: z.string().min(1, "Vui lòng chọn khách hàng"),
  agreedPrice: z.number().positive("Giá bán phải lớn hơn 0"),
  depositAmount: z.number().min(0, "Số tiền cọc không hợp lệ").optional(),
  depositDate: z.string().optional(),
  notes: z.string().optional(),
});

// Update booking schema
export const bookingUpdateSchema = z.object({
  agreedPrice: z.number().positive("Giá bán phải lớn hơn 0").optional(),
  depositAmount: z.number().min(0).optional(),
  depositDate: z.string().optional(),
  contractDate: z.string().optional(),
  handoverDate: z.string().optional(),
  status: BookingStatus.optional(),
  notes: z.string().optional(),
});

// Approve booking schema
export const bookingApproveSchema = z.object({
  action: z.literal("approve"),
});

// Cancel booking schema
export const bookingCancelSchema = z.object({
  action: z.literal("cancel"),
  reason: z.string().min(1, "Vui lòng nhập lý do hủy"),
});

// Add deposit schema
export const addDepositSchema = z.object({
  action: z.literal("add_deposit"),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

// Add payment schema
export const addPaymentSchema = z.object({
  action: z.literal("add_payment"),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

// Transaction create schema
export const transactionCreateSchema = z.object({
  bookingId: z.string().min(1),
  type: TransactionType,
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

// Types
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
