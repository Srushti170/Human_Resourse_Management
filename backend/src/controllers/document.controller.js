import Document from "../models/document.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadDocument = asyncHandler(async (req, res) => {
  const doc = await Document.create({
    ...req.body,
    employee: req.user._id,
    uploadedBy: req.user._id,
  });

  res.json(doc);
});

export const getDocuments = asyncHandler(async (req, res) => {
  const list = await Document.find({ employee: req.user._id });
  res.json(list);
});

export const downloadDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  res.json(doc);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  await Document.findByIdAndDelete(req.params.id);
  res.json({ message: "Document deleted" });
});
