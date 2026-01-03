import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  const list = await Notification.getUnreadNotifications(req.user._id);
  res.json(list);
};

export const markAsRead = async (req, res) => {
  const noti = await Notification.findById(req.params.id);
  await noti.markAsRead();
  res.json(noti);
};

export const deleteNotification = async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ message: "Notification deleted" });
};
