interface HeroProps {
  title: string;
}

export default function Hero({ title }: HeroProps) {
  return (
    <section className="hero">
      <div className="overlay">
        <h1>{title}</h1>
      </div>
    </section>
  );
}
