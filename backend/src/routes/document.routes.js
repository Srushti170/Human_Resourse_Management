import express from "express";
import {
  uploadDocument,
  getDocuments,
  downloadDocument,
  deleteDocument,
} from "../controllers/document.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, uploadDocument);
router.get("/", protect, getDocuments);
router.get("/:id", protect, downloadDocument);
router.delete("/:id", protect, deleteDocument);

export default router;
