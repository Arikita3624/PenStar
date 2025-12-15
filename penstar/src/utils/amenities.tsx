import {
  WifiOutlined,
  CoffeeOutlined,
  SnippetsOutlined,
  HolderOutlined,
  HomeOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

const blackIconStyle = { fontSize: "18px", color: "#222" };
const amenityIconMap = [
  {
    keywords: ["wifi", "tốc độ", "internet"],
    icon: <WifiOutlined style={blackIconStyle} />,
  },
  {
    keywords: ["nước", "suối", "chai"],
    icon: <CoffeeOutlined style={blackIconStyle} />,
  },
  {
    keywords: ["bàn chải", "đánh răng", "kem"],
    icon: <SnippetsOutlined style={blackIconStyle} />,
  },
  {
    keywords: ["dầu", "gội", "sữa tắm"],
    icon: <HolderOutlined style={blackIconStyle} />,
  },
  {
    keywords: ["khăn", "tắm", "mặt"],
    icon: <HomeOutlined style={blackIconStyle} />,
  },
  {
    keywords: ["dép"],
    icon: <HomeOutlined style={blackIconStyle} />,
  },
  {
    keywords: ["minibar", "đồ uống", "gas"],
    icon: <CoffeeOutlined style={blackIconStyle} />,
  },
  {
    keywords: ["room service", "24/7"],
    icon: <PhoneOutlined style={blackIconStyle} />,
  },
  {
    keywords: ["giặt", "là"],
    icon: <HomeOutlined style={blackIconStyle} />,
  },
  {
    keywords: ["snack", "ăn nhẹ"],
    icon: <CoffeeOutlined style={blackIconStyle} />,
  },
];

export function getAmenityIcon(name: string) {
  const lowerName = name.toLowerCase();
  for (const item of amenityIconMap) {
    if (item.keywords.some((keyword) => lowerName.includes(keyword))) {
      return item.icon;
    }
  }
  return <HomeOutlined style={blackIconStyle} />;
}
