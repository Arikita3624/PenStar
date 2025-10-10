import { Routes, Route, Navigate } from "react-router-dom";
import Rooms from "./components/pages/admin/rooms/Rooms";
import RoomAdd from "./components/pages/admin/rooms/RoomAdd";
import RoomEdit from "./components/pages/admin/rooms/RoomEdit";
import { Layout } from "antd";
import Branches from "./components/pages/admin/branches/Branches";
import BranchAdd from "./components/pages/admin/branches/BranchesAdd";
import BranchEdit from "./components/pages/admin/branches/BranchesEdit";

const { Header, Content } = Layout;

const App = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ color: "white", fontSize: 20 }}>🏨 PenStar Admin</Header>
      <Content style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/rooms" />} />
          <Route path="/admin/branches" element={<Branches />} />
          <Route path="/admin/branches/add" element={<BranchAdd />} />
          <Route path="/admin/branches/edit/:id" element={<BranchEdit />} />
          <Route path="/admin/rooms" element={<Rooms />} />
          <Route path="/admin/rooms/add" element={<RoomAdd />} />
          <Route path="/admin/rooms/edit/:id" element={<RoomEdit />} />
        </Routes>
      </Content>
    </Layout>
  );
};

export default App;
