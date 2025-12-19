import * as model from "../models/master_equipmentsmodel.js";

export const getAllEquipments = async (req, res) => {
  try {
    const equipments = await model.getAllEquipments();
    res.json({ success: true, data: equipments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEquipmentById = async (req, res) => {
  try {
    const equipment = await model.getEquipmentById(Number(req.params.id));
    if (!equipment)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEquipment = async (req, res) => {
  try {
    const equipment = await model.createEquipment(req.body);
    res.status(201).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEquipment = async (req, res) => {
  try {
    const equipment = await model.updateEquipment(
      Number(req.params.id),
      req.body
    );
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEquipment = async (req, res) => {
  try {
    const equipment = await model.deleteEquipment(Number(req.params.id));
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
