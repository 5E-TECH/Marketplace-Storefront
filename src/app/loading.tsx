import { Container, LoadingGrid } from "@/components/ui";

export default function Loading() {
  return <main><Container><section className="route-loading"><div><i/><i/></div><LoadingGrid count={5} label="Sahifa yuklanmoqda"/></section></Container></main>;
}
