import { ConfigProvider } from "antd";
import type { ReactNode } from "react";

type AntFormConfigProps = {
  children: ReactNode;
};
const AntConfig = ({ children }: AntFormConfigProps) => {
  return (
    <ConfigProvider
      componentSize="large"
      theme={{
        token: {
          colorBorder: "#f84565",
          // colorBgBase: "#f84565",
          colorBorderBg: "#f84565",
          boxShadow: "0 0 0 rgba(248, 69, 101, 0.2)",
          colorTextPlaceholder: "#f84565",
        },
        components: {
          Form: {
            itemMarginBottom: 24,
            labelFontSize: 20,
            labelColor: "#f84565",
            labelRequiredMarkColor: "#f84565",
          },
          Input: {
            colorBgBase: "black",
            activeBorderColor: "#f84565",
            hoverBorderColor: "#f84565",
            // colorBgContainerDisabled: "red",
          },
          InputNumber: {
            colorBgBase: "black",
            activeBorderColor: "#f84565",
            hoverBorderColor: "#f84565",
            colorText: "#f84565",
          },
          Select: {
            colorBgBase: "black",
            activeBorderColor: "#f84565",
            hoverBorderColor: "#f84565",
            colorText: "#f84565",
            selectorBg: "#000000",
            optionSelectedBg: "#140000",
          },
          Message: {
            contentBg: "#f84565",
            colorText: "white",
            colorSuccess: "#00ee20",
            colorError: "#000000",
            colorIcon: "white",
            colorInfo: "pink",
          },
          Modal: {
            contentBg: "#000000",
            colorBorder: "#f84565",
            headerBg: "#000000",
            colorText: "#f84565",
          },
          Tooltip: {
            colorText: "#ffffff",
          },
          Table: {
            // colorBgContainer: "black",
            // colorText: "#f84565",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};
export default AntConfig;
