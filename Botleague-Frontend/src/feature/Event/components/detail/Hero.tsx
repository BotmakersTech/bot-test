interface HeroProps {
  title: string;
  imageUrl?: string | null;
}

export default function Hero({ title, imageUrl }: HeroProps) {
  return (
    <section
      className="hero"
      style={
        imageUrl
          ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      <div className="overlay">
        <h1>{title}</h1>
      </div>
    </section>
  );
}
