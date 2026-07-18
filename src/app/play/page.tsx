import { redirect } from "next/navigation";
import GameScreen from "@/components/game/GameScreen";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; modo?: string }>;
}) {
  const { nivel = "departamentos", modo = "pin" } = await searchParams;

  // Por ahora solo está implementado el nivel departamental en modo pin
  if (nivel !== "departamentos" || modo !== "pin") redirect("/");

  return <GameScreen />;
}
