import axios from "axios";

const API_URL = "http://localhost:5000/api/rooms";

export default async function getRooms() {
  const res = await axios.get(API_URL);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to get rooms");
  }
}
