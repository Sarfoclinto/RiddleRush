import { Button, Modal } from "antd";

type DeleteProps = {
  isOpen: boolean;
  close: () => void;
  action: () => void;
  loading: boolean;
  title?: string;
  message?: string;
};
const DeleteOrQuitModal = ({
  action,
  close,
  isOpen,
  loading,
  message,
  title,
}: DeleteProps) => {
  return (
    <Modal
      open={isOpen}
      onCancel={close}
      footer={[
        <Button
          type="primary"
          size="small"
          className="!bg-black !border !border-primary !text-primary"
          onClick={close}
        >
          No
        </Button>,
        <Button
          type="primary"
          size="small"
          loading={loading}
          disabled={loading}
          className="!bg-primary !text-white"
          onClick={action}
        >
          Yes
        </Button>,
      ]}
      className="!border !border-primary !rounded-xl"
      title={
        <span className="!text-primary">
          {title ?? "Quit and Delete Playtime"}
        </span>
      }
    >
      <p className="lg:text-lg font-medium text-primary">
        {message ?? "Are you sure you want to quit and delete this playtime?"}
      </p>
    </Modal>
  );
};
export default DeleteOrQuitModal;
