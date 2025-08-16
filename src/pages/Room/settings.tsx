import { Form, message, InputNumber, Select, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { cat } from "@/assets/data";
import { capitalize } from "@/utils/fns";
import { ArrowRightIcon } from "lucide-react";

const RoomSettings = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const options = cat.map((ct) => ({
    label: capitalize(ct),
    value: ct.toLowerCase(),
  }));

  const skipOptions = [
    { label: "Use new", value: "new" },
    { label: "Pass to neext user", value: "pass" },
  ];

  const toast = useCallback(
    (message?: string, type?: "success" | "error" | "info") => {
      messageApi.open({
        type: type ?? "success",
        content: message ?? "Successful",
      });
    },
    [messageApi]
  );
  const onFinish = (values: unknown) => {
    console.log("form values: ", values);
    navigate(`/room/settings/${45}`);
  };

  const onFinishFailed = () => {
    toast("Please fill all required fields", "error");
  };
  return (
    <div className="flex w-full flex-col h-full items-center justify-center">
      {contextHolder}
      <span className="text-lg lg:text-2xl font-medium">Room settings</span>
      <Form
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        className="w-full flex items-center justify-center"
      >
        <div className="w-5/6 md:w-3/6 flex flex-col">
          <Form.Item
            name="numberOfRiddles"
            rules={[
              { required: true, message: "Number of riddles is required" },
            ]}
            label={<span className="font-medium !my-0">No. of riddles</span>}
            className="!my-0 !mb-3"
          >
            <InputNumber
              variant="outlined"
              className="!bg-black !text-primary !my-0 !w-full !shadow-none"
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 items-center md:gap-10">
            <Form.Item
              name="category"
              rules={[
                {
                  required: true,
                  message: "Please select category",
                },
              ]}
              label={<span className="font-medium !my-0">Select category</span>}
              className="!my-0 !mb-3"
            >
              <Select
                variant="outlined"
                placeholder="Please select category"
                options={options}
                className="!bg-black !text-primary !my-0 !w-full !shadow-none"
                styles={{
                  popup: {
                    root: {
                      color: "black",
                      backgroundColor: "#000000",
                    },
                  },
                }}
              />
            </Form.Item>

            <Form.Item
              name="skipBehaviour"
              rules={[
                {
                  required: true,
                  message: "Please select skip behaviour",
                },
              ]}
              label={<span className="font-medium !my-0">Skip behaviour</span>}
              className="!my-0 !mb-3"
            >
              <Select
                variant="outlined"
                placeholder="Select skip behaviour"
                options={skipOptions}
                className="!bg-black !text-primary !my-0 !w-full !shadow-none"
                styles={{
                  popup: {
                    root: {
                      color: "black",
                      backgroundColor: "#000000",
                    },
                  },
                }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="timeSpan"
            rules={[
              { required: true, message: "Seconds per riddle is required" },
            ]}
            label={
              <span className="font-medium !my-0">Seconds per riddle</span>
            }
            className="!my-0 !mb-3"
          >
            <InputNumber
              variant="outlined"
              className="!bg-black !text-primary !my-0 !w-full !shadow-none"
              min={5}
              max={61}
            />
          </Form.Item>

          <Button
            block
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
export default RoomSettings;
