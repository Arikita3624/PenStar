import { Routes, Route, Navigate } from "react-router-dom";
import Rooms from "./components/pages/admin/rooms/Rooms";
import RoomAdd from "./components/pages/admin/rooms/RoomAdd";
import RoomEdit from "./components/pages/admin/rooms/RoomEdit";
import { Layout } from "antd";

const { Header, Content } = Layout;

const App = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ color: "white", fontSize: 20 }}>🏨 PenStar Admin</Header>
      <Content style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/rooms" />} />
          <Route path="/admin/rooms" element={<Rooms />} />
          <Route path="/admin/rooms/add" element={<RoomAdd />} />
          <Route path="/admin/rooms/:id/edit" element={<RoomEdit />} />
        </Routes>
      </Content>
    </Layout>
  );
};

export default App;
