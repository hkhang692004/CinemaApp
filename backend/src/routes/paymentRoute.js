import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import paymentController from '../controllers/paymentController.js';

const router = express.Router();

// Protected routes (require login)
router.post('/orders', protectedRoute, paymentController.createOrder);
router.get('/loyalty', protectedRoute, paymentController.getLoyaltyInfo);
router.post('/vnpay/create', protectedRoute, paymentController.createVnpayPayment);
router.post('/vnpay/verify', protectedRoute, paymentController.verifyVnpayPayment);
router.get('/orders/:orderId', protectedRoute, paymentController.getOrderDetails);
router.get('/my-tickets', protectedRoute, paymentController.getMyTickets);

// Promotion routes
router.post('/promotions/validate', protectedRoute, paymentController.validatePromotion);
router.get('/promotions', protectedRoute, paymentController.getActivePromotions);

// Invoice routes
router.post('/invoices', protectedRoute, paymentController.requestInvoice);
router.get('/invoices/:orderId', protectedRoute, paymentController.getInvoice);

// Public routes (VNPay callbacks)
router.get('/vnpay-return', paymentController.vnpayReturn);
router.get('/vnpay-ipn', paymentController.vnpayIPN);

export default router;
