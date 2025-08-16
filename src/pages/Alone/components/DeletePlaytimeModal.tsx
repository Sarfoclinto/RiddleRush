import { Button, Modal } from "antd";

type DeleteProps = {
  isOpen: boolean;
  close: () => void;
  action: () => void;
  loading: boolean;
};
const DeletePlaytimeModal = ({
  action,
  close,
  isOpen,
  loading,
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
          Cancel
        </Button>,
        <Button
          type="primary"
          size="small"
          loading={loading}
          disabled={loading}
          className="!bg-primary !text-white"
          onClick={action}
        >
          Delete
        </Button>,
      ]}
      className="!border !border-primary !rounded-xl"
      title={<span className="!text-primary">Delete Playtime</span>}
    >
      <p className="lg:text-lg font-medium text-primary">
        Are you sure you want to delete this playtime?
      </p>
    </Modal>
  );
};
export default DeletePlaytimeModal;
