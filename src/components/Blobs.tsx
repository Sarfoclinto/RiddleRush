const Blobs = () => {
  return (
    <div>
      <div
        className="blob w-72 h-72 bg-[#f84565]"
        style={{ top: "-10%", left: "-10%" }}
      ></div>
      <div
        className="blob w-96 h-96 bg-pink-500"
        style={{ bottom: "-15%", right: "-15%", animationDelay: "4s" }}
      ></div>
    </div>
  );
};
export default Blobs;
