import { Router } from "express";
import {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    bulkInsertTransactions,
    clearAllTransactions
} from "../controllers/transactions.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this router
router.use(verifyJWT);

// Routes
router.route("/")
    .post(createTransaction)
    .get(getTransactions);

router.route("/clear-all")
    .delete(clearAllTransactions);

router.route("/bulk")
    .post(bulkInsertTransactions);

router.route("/:id")
    .put(updateTransaction)
    .delete(deleteTransaction);

export default router;
