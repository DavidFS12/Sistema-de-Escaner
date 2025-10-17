import Lanyard from "../components/Lanyard";

export default function Demo() {
  return (
    <div>
      <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
    </div>
  );
}
