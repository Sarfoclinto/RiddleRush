const Home = () => {
  const particles = Array.from({ length: 40 });
  return (
    <div className="relative min-h-full h-full overflow-hidden">
      {particles.map((_, i) => {
        const size = Math.random() * 4 + 2; // size 2px to 6px
        const left = Math.random() * 100; // random position across width
        const delay = Math.random() * 10; // delay for randomness
        const duration = Math.random() * 10 + 10; // speed variation

        return (
          <span
            key={i}
            className="particle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              bottom: `-${size}px`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      <div className="relative h-full z-10 flex flex-col items-center justify-center gap-y-5 overflow-hidden">
        {/* <div
          className="blob w-72 h-72 bg-[#f84565]"
          style={{ top: "-10%", left: "-10%" }}
        ></div>
        <div
          className="blob w-96 h-96 bg-pink-500"
          style={{ bottom: "-15%", right: "-15%", animationDelay: "4s" }}
        ></div> */}
        <p className="text-3xl font-medium font-serif">
          Choose your adventure...
        </p>
        <div className="flex flex-col items-center">
          <button className="border-primary border w-fit flex items-center justify-center gap-2 mb-5 px-20 sm:py-3 py-2 sm:px-16 hover:bg-primary-dull active:bg-primary-dull duration-200 hover:shadow-[0_0_20px_#f84565] active:shadow-[0_0_20px_#f84565] active:scale-95 transition rounded-full font-medium cursor-pointer">
            Play Alone
          </button>
          <button className="border-primary border w-fit flex items-center justify-center gap-2 mb-5 px-20 sm:py-3 py-2 sm:px-16 hover:bg-primary-dull active:bg-primary-dull duration-200 hover:shadow-[0_0_20px_#f84565] active:shadow-[0_0_20px_#f84565] active:scale-95 transition rounded-full font-medium cursor-pointer">
            Create Room
          </button>
          <button className="border-primary border w-fit flex items-center justify-center gap-2 mb-5 px-20 sm:py-3 py-2 sm:px-16 hover:bg-primary-dull active:bg-primary-dull duration-200 hover:shadow-[0_0_20px_#f84565] active:shadow-[0_0_20px_#f84565] active:scale-95 transition rounded-full font-medium cursor-pointer">
            Join room
          </button>
        </div>
      </div>
    </div>
  );
};
export default Home;
