import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Switch,
  message,
  Space,
  Select,
  Row,
  Col,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDiscountCode } from "@/services/discountCodesApi";
import dayjs from "dayjs";
import React from "react";

// Helper functions để format số tiền theo chuẩn Việt Nam
const formatCurrency = (value: number | string | undefined): string => {
  if (!value && value !== 0) return "";
  const num = typeof value === "string" ? parseFloat(value.replace(/\./g, "")) : value;
  if (isNaN(num)) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseCurrency = (value: string | undefined): number | string => {
  if (!value) return "";
  const num = parseFloat(value.replace(/\./g, ""));
  return isNaN(num) ? "" : num;
};

const DiscountCodeAdd = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [discountType, setDiscountType] = React.useState<"percentage" | "fixed">("percentage");

  const createMut = useMutation({
    mutationFn: createDiscountCode,
    onSuccess: () => {
      message.success("Tạo mã giảm giá thành công");
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
      navigate("/admin/discount-codes");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      message.error(
        err?.response?.data?.message || "Không thể tạo mã giảm giá"
      );
    },
  });

  const onFinish = (values: {
    code: string;
    description: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    min_order_amount?: number;
    max_discount_amount?: number;
    usage_limit?: number;
    valid_from: dayjs.Dayjs;
    valid_until: dayjs.Dayjs;
    is_active?: boolean;
  }) => {
    createMut.mutate({
      code: values.code.trim().toUpperCase(),
      description: values.description,
      discount_type: values.discount_type,
      discount_value: values.discount_value,
      min_order_amount: values.min_order_amount || 0,
      max_discount_amount: values.max_discount_amount || undefined,
      usage_limit: values.usage_limit || undefined,
      valid_from: values.valid_from.toISOString(),
      valid_until: values.valid_until.toISOString(),
      is_active: values.is_active !== false,
    });
  };

  return (
    <div>
      <div className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/discount-codes")}
        >
          Quay lại
        </Button>
      </div>

      <Card title="Thêm mã giảm giá mới">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            discount_type: "percentage",
            is_active: true,
            min_order_amount: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Mã giảm giá"
                name="code"
                rules={[
                  { required: true, message: "Vui lòng nhập mã giảm giá" },
                  {
                    pattern: /^[A-Za-z0-9\s\-_]+$/,
                    message: "Mã chỉ được chứa chữ, số, khoảng trắng, dấu gạch ngang và dấu gạch dưới",
                  },
                  {
                    min: 3,
                    message: "Mã giảm giá phải có ít nhất 3 ký tự",
                  },
                  {
                    max: 50,
                    message: "Mã giảm giá không được quá 50 ký tự",
                  },
                ]}
              >
                <Input
                  placeholder="Ví dụ: SUMMER2024 hoặc flash-sale-2024"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Mô tả"
                name="description"
                rules={[
                  { required: true, message: "Vui lòng nhập mô tả" },
                ]}
              >
                <Input placeholder="Mô tả mã giảm giá" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Loại giảm giá"
                name="discount_type"
                rules={[
                  { required: true, message: "Vui lòng chọn loại giảm giá" },
                ]}
              >
                <Select
                  onChange={(value) => {
                    setDiscountType(value);
                    // Reset discount_value khi đổi loại
                    form.setFieldValue("discount_value", undefined);
                  }}
                >
                  <Select.Option value="percentage">Phần trăm (%)</Select.Option>
                  <Select.Option value="fixed">Số tiền cố định (VNĐ)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giá trị giảm"
                name="discount_value"
                rules={[
                  { required: true, message: "Vui lòng nhập giá trị giảm" },
                  {
                    validator: (_, value) => {
                      if (!value && value !== 0) {
                        return Promise.reject(new Error("Vui lòng nhập giá trị giảm"));
                      }
                      const num = typeof value === "string" 
                        ? parseFloat(value.replace(/\./g, "")) 
                        : Number(value);
                      if (isNaN(num) || num <= 0) {
                        return Promise.reject(new Error("Giá trị phải lớn hơn 0"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0.01}
                  step={discountType === "fixed" ? 1000 : 0.01}
                  placeholder={discountType === "fixed" ? "Nhập số tiền" : "Nhập phần trăm"}
                  formatter={
                    discountType === "fixed"
                      ? (value) => formatCurrency(value)
                      : undefined
                  }
                  parser={
                    discountType === "fixed"
                      ? ((value) => {
                          const parsed = parseCurrency(value);
                          return typeof parsed === "number" ? parsed : 0.01;
                        }) as (value: string | undefined) => 0.01
                      : undefined
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Đơn hàng tối thiểu (VNĐ)"
                name="min_order_amount"
                rules={[
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || value === "") {
                        return Promise.resolve(); // Optional field
                      }
                      const num = typeof value === "string"
                        ? parseFloat(value.replace(/\./g, ""))
                        : Number(value);
                      if (isNaN(num) || num < 0) {
                        return Promise.reject(new Error("Giá trị phải >= 0"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={1000}
                  placeholder="0"
                  formatter={(value) => formatCurrency(value)}
                  parser={((value) => {
                    const parsed = parseCurrency(value);
                    return typeof parsed === "number" ? parsed : 0;
                  }) as (value: string | undefined) => 0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giảm tối đa (VNĐ) - Chỉ áp dụng cho loại phần trăm"
                name="max_discount_amount"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={1000}
                  placeholder="Không giới hạn"
                  formatter={(value) => formatCurrency(value)}
                  parser={((value) => {
                    const parsed = parseCurrency(value);
                    return typeof parsed === "number" ? parsed : 0;
                  }) as (value: string | undefined) => 0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Giới hạn số lần sử dụng"
                name="usage_limit"
                tooltip="Để trống nếu không giới hạn"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  step={1}
                  placeholder="Không giới hạn"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Trạng thái"
                name="is_active"
                valuePropName="checked"
              >
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Có hiệu lực từ"
                name="valid_from"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày bắt đầu" },
                ]}
              >
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Có hiệu lực đến"
                name="valid_until"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày kết thúc" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const validFrom = getFieldValue("valid_from");
                      if (!value || !validFrom) {
                        return Promise.resolve();
                      }
                      if (dayjs(value).isBefore(dayjs(validFrom))) {
                        return Promise.reject(
                          new Error("Ngày kết thúc phải sau ngày bắt đầu")
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMut.isPending}>
                Tạo mã giảm giá
              </Button>
              <Button onClick={() => navigate("/admin/discount-codes")}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DiscountCodeAdd;

