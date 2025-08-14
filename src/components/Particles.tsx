const Particles = () => {
  const particles = Array.from({ length: 40 });
  return particles.map((_, i) => {
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
  });
};
export default Particles;
