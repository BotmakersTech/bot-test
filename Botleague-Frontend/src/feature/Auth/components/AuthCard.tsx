interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
  
      <>
      <div className="cna-form-header">
        <h2 className="cna-title">{title}</h2>
        {subtitle && <p className="cna-subtitle">{subtitle}</p>}
      </div>

      <div className="cna-form">{children}</div>
    
    </>
  );
}