import { cat } from "@/assets/data";
import type { PlaytimeForm } from "@/types/common";
import { capitalize } from "@/utils/fns";
import { Button, Form, Input, InputNumber, Select } from "antd";
import { ArrowRightIcon } from "lucide-react";
import { removeFromStorage, saveToStorage } from "@/services/storage";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";

const Config = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  
  const options = cat.map((ct) => ({
    label: capitalize(ct),
    value: ct.toLowerCase(),
  }));

  useEffect(() => {
    if (isSignedIn && user) {
      form.setFieldsValue({
        username: user.username || undefined,
      });
    }
  }, [form, isSignedIn, user, user?.username]);

  const createPlaytime = useAction(api.actions.createPlaytime);

  const onFinish = async (values: PlaytimeForm) => {
    setLoading(true);
    removeFromStorage("playtimeForm");
    try {
      const playtimeId = await createPlaytime({
        username: values.username,
        numberOfRiddles: values.numberOfRiddles,
        category: values.category,
        timeSpan: values.timeSpan,
      });
      if (playtimeId) {
        saveToStorage("playtimeId", playtimeId);
        navigate(`/alone/playtime/${playtimeId}`);
      }
    } catch (error) {
      console.error("Error creating playtime:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex w-full flex-col h-full items-center justify-center">
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        className="w-full flex items-center justify-center"
      >
        <div className="w-5/6 md:w-3/6 flex flex-col">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Username is required here" }]}
            label={<span className="font-medium !my-0">Username</span>}
            className="!my-0 !mb-3"
          >
            <Input
              variant="outlined"
              disabled={isSignedIn && !!user?.username}
              className="!bg-black !text-primary !my-0 !shadow-none"
              placeholder="Username eg.Sherlock, LoneWolf"
            />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 items-center md:gap-10">
            <Form.Item
              name="numberOfRiddles"
              rules={[
                {
                  required: true,
                  message: "Number of questions is required here",
                },
              ]}
              label={<span className="font-medium !my-0">No. of riddles</span>}
              className="!my-0 !mb-3"
            >
              <InputNumber
                variant="outlined"
                className="!bg-black !text-primary !my-0 !w-full !shadow-none"
              />
            </Form.Item>
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
          </div>

          <Form.Item
            name="timeSpan"
            rules={[
              {
                required: true,
                message: "Seconds is required",
              },
            ]}
            label={
              <span className="font-medium !my-0">Seconds per question(s)</span>
            }
            className="!my-0 !mb-3"
          >
            <InputNumber
              variant="outlined"
              className="!bg-black !text-primary !my-0 !w-full !shadow-none"
              max={61}
              min={1}
            />
          </Form.Item>

          <Button
            block
            loading={loading}
            disabled={loading}
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
export default Config;
