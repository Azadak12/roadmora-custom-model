import logo from '../assets/roadmora-logo.png';

export default function BrandLogo() {
  return (
    <span className="brand-logo">
      <img src={logo} alt="Roadmora AI" width="6000" height="6000" draggable="false" />
    </span>
  );
}
