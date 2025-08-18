import { Button, Form, Input, InputNumber, message, Radio } from "antd";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowRightIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateRoom = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const toast = useCallback(
    (message?: string, type?: "success" | "error" | "info") => {
      messageApi.open({
        type: type ?? "success",
        content: message ?? "Successful",
      });
    },
    [messageApi]
  );

  const createRoom = useMutation(api.rooms.createRoom);
  const onFinish = async (values: {
    name: string;
    status: "public" | "private";
    maxPlayers: number;
  }) => {
    setCreating(true);
    try {
      const roomId = await createRoom({
        name: values.name || undefined,
        status: values.status,
        maxPlayers: values.maxPlayers,
      });
      if (roomId) {
        navigate(`/room/settings/${roomId}`);
      }
    } catch (error) {
      console.error(error);
      toast("Something went wrong", "error");
    } finally {
      setCreating(false);
    }
  };

  const onFinishFailed = async () => {
    toast("Please fill all required fields", "error");
  };
  return (
    <div className="flex w-full flex-col h-full items-center justify-center">
      {contextHolder}
      <span className="text-lg lg:text-2xl font-medium">Create Room</span>
      <Form
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        className="w-full flex items-center justify-center"
      >
        <div className="w-5/6 md:w-3/6 flex flex-col">
          <Form.Item
            name="name"
            label={<span className="font-medium !my-0">Room name</span>}
            className="!my-0 !mb-3"
          >
            <Input
              variant="outlined"
              className="!bg-black !text-primary !my-0 !shadow-none"
              placeholder="Enter room name if any"
            />
          </Form.Item>

          <Form.Item
            name="maxPlayers"
            rules={[{ required: true, message: "Room max size is required" }]}
            label={<span className="font-medium !my-0">Room max capacity</span>}
            className="!my-0 !mb-3"
          >
            <InputNumber
              variant="outlined"
              className="!bg-black !text-primary !my-0 !w-full !shadow-none"
            />
          </Form.Item>

          <Form.Item
            name="status"
            rules={[{ required: true, message: "Room status is required" }]}
            label={<span className="font-medium !my-0">Romm Status</span>}
            className="!my-0 !mb-3"
          >
            <Radio.Group className="w-full flex items-center justify-between">
              <Radio value={"public"} className="!text-primary !text-lg">
                Public
              </Radio>
              <Radio value={"private"} className="!text-primary !text-lg">
                Private
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Button
            block
            loading={creating}
            disabled={creating}
            type="primary"
            className="!bg-[#f84565] hover:!bg-primary-dull !border-none !outline-none !text-black mt-5 !flex !items-center"
            htmlType="submit"
          >
            <span>Proceed</span>
            <ArrowRightIcon className="bounce-x" />
          </Button>
        </div>
      </Form>
    </div>
  );
};
export default CreateRoom;
