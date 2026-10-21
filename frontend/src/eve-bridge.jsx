import { useEveAgent } from "eve/react";

export default function EveBridge({ host, children }) {
  const agent = useEveAgent({ host, followIdle: false });
  return children(agent);
}
